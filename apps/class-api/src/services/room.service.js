// /room.service.js
import { docker } from "../utils/docker.js";
import { collectAndRemoveClassContainers } from "../room/student_collect_exec.js";

import { createNetwork, connectNetworkToTraefik } from "../room/network.js";
import { stopAll, upStack } from "../room/stack.js";
import { createStudentContainer } from "../room/student.js";
import { changeStatus } from "./class.service.js";

function ts() {
  return new Date().toISOString();
}
function log(...a) {
  console.log(`[room.service ${ts()}]`, ...a);
}
function warn(...a) {
  console.warn(`[room.service ${ts()}]`, ...a);
}
function errlog(...a) {
  console.error(`[room.service ${ts()}]`, ...a);
}

export const upClassBySubject = async ({ classId, students, type }) => {
  log("upClassBySubject start", { classId, type, studentsCount: students?.length });

  const update = await changeStatus({ classId, type });
  const subject = classId.split("_")[1];

  log("parsed subject", { classId, subject, type });

  if (subject === "web" && type === "examStatus") {
    const upC = await upClassWithStudentContainer({ classId, students });
    return { update, upC };
  }

  const stack = await upStack({ subject, type });
  return { stack, update };
};

export async function upClassWithStudentContainer({ classId, students }) {
  log("upClassWithStudentContainer start", { classId, studentsCount: students?.length });

  const networkName = await createNetwork(classId);
  log("network ready", { networkName });

  await connectNetworkToTraefik(networkName);
  log("traefik attached to class network", { networkName });

  // tạo container sinh viên
  const results = await Promise.all(
    (students || []).map(async (s) => {
      try {
        const r = await createStudentContainer(classId, networkName, s);
        log("student container up OK", {
          studentId: s,
          name: r?.name,
          fqdn: r?.fqdn,
          ip: r?.ip,
          volumeName: r?.volumeName,
        });
        return { ok: true, ...r };
      } catch (e) {
        errlog("student container up FAIL", {
          studentId: s,
          error: e?.message || String(e),
        });
        return { ok: false, studentId: s, error: e?.message || String(e) };
      }
    })
  );

  const ok = results.filter((x) => x.ok).length;
  const fail = results.length - ok;

  log("upClassWithStudentContainer done", { classId, ok, fail });

  return { message: "Up class success !", ok, fail, results };
}

export async function downClass(classId, opts = {}) {
  const {
    removeWorkspace = false,
    allowPartial = false,
    traefikName = "traefik",
    networkPrefix = "classnet-",
  } = opts;

  const networkName = `${networkPrefix}${classId}`;
  const errors = [];

  log("downClass start", { classId, networkName, removeWorkspace, allowPartial, traefikName });

  let results = [];
  try {
    results = await collectAndRemoveClassContainers(classId, { removeWorkspace });
    log("collect results count", { classId, count: results.length });

    // log chi tiết từng student
    for (const r of results) {
      log("collect result", {
        studentId: r.studentId,
        name: r.name,

        // student_collect_exec.js trả về uploadedPrefix (không có uploadedKey)
        uploadedPrefix: r.uploadedPrefix || "",

        // thông tin minio hữu ích để trace
        bucket: r.bucket || "",
        minioBasePrefix: r.minioBasePrefix || "",
        minioFinalPrefix: r.minioFinalPrefix || "",
        attemptId: r.attemptId || "",

        error: r.error || "",

        volumeRemoved: r.volumeRemoved,
        volumeRemoveError: r.volumeRemoveError || "",
      });

      if (r.log) {
        log("push-to-minio raw log (first 800 chars)", String(r.log).slice(0, 800));
      }
    }
  } catch (e) {
    const msg = `collect failed: ${e?.message || e}`;
    errors.push(msg);
    errlog(msg);
  }

  const collected = results.filter((r) => r.uploadedPrefix);
  const skipped = results.filter((r) => !r.uploadedPrefix);

  log("downClass summary", {
    classId,
    collected: collected.length,
    skipped: skipped.length,
    errorsCount: errors.length,
  });

  if (!allowPartial && skipped.length > 0) {
    warn("aborted teardown due to skipped uploads", { classId, skipped: skipped.length });
    return {
      classId,
      collected,
      skipped,
      errors: [...errors, `aborted teardown: ${skipped.length} student(s) upload failed/empty`],
    };
  }

  // detach traefik
  try {
    await docker.getNetwork(networkName).disconnect({ Container: traefikName, Force: true });
    log("detached traefik from class network", { traefikName, networkName });
  } catch (e) {
    warn("detach traefik failed (ignored)", { traefikName, networkName, error: e?.message || e });
  }

  // remove network
  try {
    await docker.getNetwork(networkName).remove();
    log("removed class network", { networkName });
  } catch (e) {
    const msg = `remove network failed: ${e?.message || e}`;
    errors.push(msg);
    errlog(msg);
  }

  log("downClass done", { classId, networkName, errorsCount: errors.length });
  return { classId, collected, skipped, errors };
}

export async function stopAllContainer({ classId, type }) {
  log("stopAllContainer start", { classId, type });

  const update = await changeStatus({ classId, type });
  const subject = classId.split("_")[1];

  if (subject === "web" && type === "examStatus") {
    const down = await downClass(classId, { removeWorkspace: true, allowPartial: true });
    return { down, update };
  }

  const stack = await stopAll({ subject, type });
  return { update, stack };
}
