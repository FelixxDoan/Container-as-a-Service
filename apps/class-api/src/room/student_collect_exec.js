// room/student_collect_exec.js
import { docker } from "../utils/docker.js";
import {
  STUDENT_APP_LABEL,
  makeStudentContainerName,
  makeStudentVolumeName,
} from "../utils/student_common.js";
import { PassThrough } from "stream";

/**
 * Escape for sh single-quote context
 */
function shEscape(v) {
  const s = String(v ?? "");
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

function makeAttemptId() {
  const iso = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");
  const rnd = Math.random().toString(16).slice(2, 8);
  return `${iso}-${rnd}`;
}

function nowIso() {
  return new Date().toISOString();
}

function clip(s, n = 4000) {
  const str = String(s ?? "");
  if (str.length <= n) return str;
  return str.slice(0, n) + `\n... (clipped ${str.length - n} chars)`;
}

function parseUploadedPrefix(logStr = "") {
  const m = String(logStr).match(/uploaded_prefix:\s*(.+)\s*/i);
  return m?.[1]?.trim() || "";
}

/**
 * Docker exec returns multiplexed stream when TTY=false and both stdout/stderr attached.
 * Must demux, otherwise output gets binary frame header (\x01\x00...).
 */
async function execInContainerDetailed(container, cmd, { timeoutMs = 5 * 60 * 1000 } = {}) {
  const t0 = Date.now();

  const ex = await container.exec({
    Cmd: ["sh", "-lc", cmd],
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });

  const stream = await ex.start({ hijack: true, stdin: false });

  const stdout = new PassThrough();
  const stderr = new PassThrough();

  // demux multiplexed docker stream
  container.modem.demuxStream(stream, stdout, stderr);

  let out = "";
  let err = "";
  stdout.on("data", (d) => (out += d.toString("utf8")));
  stderr.on("data", (d) => (err += d.toString("utf8")));

  const started = Date.now();
  let exitCode = null;

  while (true) {
    const info = await ex.inspect();
    if (!info.Running) {
      exitCode = info.ExitCode ?? 0;
      break;
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(
        `exec timeout after ${timeoutMs}ms\nCMD=${cmd}\nSTDERR=${clip(err)}\nSTDOUT=${clip(out)}`
      );
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const ms = Date.now() - t0;
  return {
    cmd,
    exitCode,
    stdout: out,
    stderr: err,
    ms,
    ok: exitCode === 0,
  };
}

async function execInContainer(container, cmd, opts) {
  const r = await execInContainerDetailed(container, cmd, opts);
  if (!r.ok) {
    throw new Error(
      `exec failed exitCode=${r.exitCode} (${r.ms}ms)\nCMD=${cmd}\nSTDERR=${clip(r.stderr)}\nSTDOUT=${clip(
        r.stdout
      )}`
    );
  }
  return r.stdout;
}

async function listStudentContainersByClass(classId) {
  const list = await docker.listContainers({ all: true });
  return list.filter((x) => {
    const lb = x.Labels || {};
    return lb.app === STUDENT_APP_LABEL && String(lb.classId) === String(classId);
  });
}

/** phải gọi trước khi remove container */
async function detectWorkspaceVolumeFromMount(containerName) {
  try {
    const info = await docker.getContainer(containerName).inspect();
    const m = (info.Mounts || []).find((x) => x.Type === "volume" && x.Destination === "/workspace");
    return m?.Name || "";
  } catch {
    return "";
  }
}

function fmtHeader(name, studentId, attemptId) {
  return `[collect ${nowIso()}] [${name}] [student=${studentId}] [attempt=${attemptId}]`;
}

/**
 * Collect theo flow mới:
 * - Container env có base: MINIO_PREFIX=submissions/<class>/<student>
 * - Khi collect: override MINIO_PREFIX=<base>/<attemptId>
 * - Exec: push-to-minio (mc mirror từng file)
 * - (tuỳ chọn) verify bằng mc ls
 * - Remove container + volume (tuỳ chọn)
 */
export async function collectAndRemoveStudentContainer(classId, studentId, opts = {}) {
  const {
    removeWorkspace = true,
    attemptId: attemptIdFromOpts,
    workdir = "/workspace",

    // logs / debug knobs
    keepContainerOnError = true,
    verifyAfterPush = true,
    listWorkspaceBeforePush = true,
    listWorkspaceAfterPush = false,
    execTimeoutMs = 10 * 60 * 1000,
  } = opts;

  const name = makeStudentContainerName(classId, studentId);
  const computedVolumeName = makeStudentVolumeName(classId, studentId);
  const c = docker.getContainer(name);

  const attemptId = attemptIdFromOpts || makeAttemptId();
  const H = fmtHeader(name, studentId, attemptId);

  const detectedVolumeFromMount = removeWorkspace ? await detectWorkspaceVolumeFromMount(name) : "";

  // outputs
  let error = "";
  let pushLog = "";
  let pushErr = "";
  let uploadedPrefix = "";
  let basePrefix = "";
  let bucket = "";

  // extra debug logs
  const debug = {
    header: H,
    steps: [],
  };

  async function step(title, fn) {
    const startedAt = Date.now();
    debug.steps.push({ title, startedAt, ok: false });
    const idx = debug.steps.length - 1;
    try {
      const v = await fn();
      debug.steps[idx].ok = true;
      debug.steps[idx].ms = Date.now() - startedAt;
      return v;
    } catch (e) {
      debug.steps[idx].ok = false;
      debug.steps[idx].ms = Date.now() - startedAt;
      debug.steps[idx].error = e?.message || String(e);
      throw e;
    }
  }

  // 1) read env basePrefix + bucket
  try {
    basePrefix = (await step("read MINIO_PREFIX", async () => {
      const out = await execInContainer(c, `printf "%s" "$MINIO_PREFIX"`, { timeoutMs: 20_000 });
      return out.trim();
    })) || "";

    bucket = (await step("read MINIO_BUCKET", async () => {
      const out = await execInContainer(c, `printf "%s" "$MINIO_BUCKET"`, { timeoutMs: 20_000 });
      return out.trim();
    })) || "";
  } catch (e) {
    error = e?.message || String(e);
  }

  // 2) final prefix
  const finalPrefix = basePrefix
    ? `${basePrefix.replace(/\/+$/, "")}/${attemptId}`
    : `submissions/${String(classId)}/${String(studentId)}/${attemptId}`;

  // 3) optional: print key envs to debug
  if (!error) {
    try {
      const r = await step("debug print MINIO_* + WORKDIR", async () => {
        return await execInContainerDetailed(
          c,
          [
            `echo "MINIO_ENDPOINT=$MINIO_ENDPOINT"`,
            `echo "MINIO_BUCKET=$MINIO_BUCKET"`,
            `echo "MINIO_PREFIX=$MINIO_PREFIX"`,
            `echo "WORKDIR=${workdir}"`,
            `command -v push-to-minio || true`,
            `command -v mc || true`,
          ].join("; "),
          { timeoutMs: 20_000 }
        );
      });
      debug.envProbe = {
        exitCode: r.exitCode,
        stdout: clip(r.stdout, 8000),
        stderr: clip(r.stderr, 8000),
        ms: r.ms,
      };
    } catch (e) {
      // not fatal
      debug.envProbeError = e?.message || String(e);
    }
  }

  // 4) optional: list workspace before push
  if (!error && listWorkspaceBeforePush) {
    try {
      const r = await step("list workspace before push", async () => {
        return await execInContainerDetailed(
          c,
          [
            `echo "--- ls -la ${shEscape(workdir)} (head) ---"`,
            `ls -la ${shEscape(workdir)} | head -n 80 || true`,
            `echo "--- find files (head) ---"`,
            `find ${shEscape(workdir)} -maxdepth 3 -type f | head -n 80 || true`,
          ].join("; "),
          { timeoutMs: 30_000 }
        );
      });
      debug.workspaceBefore = {
        exitCode: r.exitCode,
        stdout: clip(r.stdout, 12000),
        stderr: clip(r.stderr, 12000),
        ms: r.ms,
      };
    } catch (e) {
      debug.workspaceBeforeError = e?.message || String(e);
    }
  }

  // 5) push snapshot (override MINIO_PREFIX)
  if (!error) {
    try {
      const r = await step("push-to-minio", async () => {
        const cmd = [
          `export WORKDIR=${shEscape(workdir)}`,
          `export MINIO_PREFIX=${shEscape(finalPrefix)}`,
          // helpful debug: print what we set
          `echo "[collector] WORKDIR=$WORKDIR"`,
          `echo "[collector] MINIO_PREFIX=$MINIO_PREFIX"`,
          `push-to-minio`,
        ].join("; ");
        return await execInContainerDetailed(c, cmd, { timeoutMs: execTimeoutMs });
      });

      pushLog = r.stdout || "";
      pushErr = r.stderr || "";
      uploadedPrefix = parseUploadedPrefix(pushLog) || "";
      debug.push = {
        exitCode: r.exitCode,
        ms: r.ms,
        stdout: clip(pushLog, 20000),
        stderr: clip(pushErr, 20000),
        uploadedPrefix,
      };

      if (r.exitCode !== 0) {
        throw new Error(
          `push-to-minio failed exitCode=${r.exitCode}\nSTDERR=${clip(pushErr)}\nSTDOUT=${clip(pushLog)}`
        );
      }
      if (!uploadedPrefix) {
        debug.pushWarn = "push-to-minio succeeded but cannot parse uploaded_prefix from stdout";
      }
    } catch (e) {
      error = e?.message || String(e);
    }
  }

  // 6) verify by listing destination (best-effort)
  if (!error && verifyAfterPush) {
    try {
      const r = await step("verify by mc ls (best-effort)", async () => {
        const dest = uploadedPrefix || `minio/${bucket || "students"}/${finalPrefix}`;
        const cmd = [
          `command -v mc >/dev/null 2>&1 || { echo "mc not found"; exit 0; }`,
          `echo "[collector] verify dest=${shEscape(dest)}"`,
          `mc ls ${shEscape(dest)} --recursive | head -n 120 || true`,
        ].join("; ");
        return await execInContainerDetailed(c, cmd, { timeoutMs: 30_000 });
      });
      debug.verify = {
        exitCode: r.exitCode,
        ms: r.ms,
        stdout: clip(r.stdout, 20000),
        stderr: clip(r.stderr, 20000),
      };
    } catch (e) {
      debug.verifyError = e?.message || String(e);
    }
  }

  // 7) optional: list workspace after push
  if (!error && listWorkspaceAfterPush) {
    try {
      const r = await step("list workspace after push", async () => {
        return await execInContainerDetailed(
          c,
          `ls -la ${shEscape(workdir)} | head -n 80 || true`,
          { timeoutMs: 20_000 }
        );
      });
      debug.workspaceAfter = {
        exitCode: r.exitCode,
        stdout: clip(r.stdout, 12000),
        stderr: clip(r.stderr, 12000),
        ms: r.ms,
      };
    } catch (e) {
      debug.workspaceAfterError = e?.message || String(e);
    }
  }

  // stop/remove container
  const shouldKeep = Boolean(error && keepContainerOnError);
  if (!shouldKeep) {
    try {
      await c.stop({ t: 10 }).catch(() => {});
      await c.remove({ force: true }).catch(() => {});
    } catch {
      // ignore
    }
  } else {
    debug.keepContainerOnError = true;
  }

  // remove volume (ưu tiên volume detect từ mount để tránh mismatch)
  let volumeNameToRemove = computedVolumeName;
  let volumeRemoved = false;
  let volumeRemoveError = "";

  if (removeWorkspace && !shouldKeep) {
    if (detectedVolumeFromMount && detectedVolumeFromMount !== computedVolumeName) {
      volumeNameToRemove = detectedVolumeFromMount;
    }
    try {
      await docker.getVolume(volumeNameToRemove).remove();
      volumeRemoved = true;
    } catch (e) {
      volumeRemoveError = e?.message || String(e);
    }
  } else if (removeWorkspace && shouldKeep) {
    debug.volumeSkipReason = "skip removing volume because keepContainerOnError=true and error happened";
  }

  return {
    studentId,
    name,
    attemptId,

    bucket: bucket || "students",
    minioBasePrefix: basePrefix || "",
    minioFinalPrefix: finalPrefix,

    uploadedPrefix, // from push-to-minio stdout
    log: pushLog,
    stderr: pushErr,
    error,

    volumeRemoved,
    volumeRemoveError,

    // 👇 logs chi tiết để track bugs
    debug,
  };
}

export async function collectAndRemoveClassContainers(classId, opts = {}) {
  const hits = await listStudentContainersByClass(classId);
  const results = [];

  for (const item of hits) {
    const studentId = item.Labels?.studentId || "unknown";
    results.push(await collectAndRemoveStudentContainer(classId, studentId, opts));
  }

  return results;
}
