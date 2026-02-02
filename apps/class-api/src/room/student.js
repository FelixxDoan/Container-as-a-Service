// room/student.js
import { docker } from "../utils/docker.js";
import { DOMAIN_SUFFIX } from "../config.js";
import {
  slugifyDns,
  normalizeSuffix,
  makeStudentContainerName,
  makeStudentVolumeName,
  makeStudentRouterKey,
  studentMetaLabels,
  studentVolumeLabels,
  slugify,
} from "../utils/student_common.js";

const MINIO_NET = process.env.MINIO_NET || "caas_minio_net";

/** ensure network tồn tại (bridge) */
async function ensureNetwork(name) {
  if (!name) throw new Error("networkName rỗng");
  try {
    await docker.getNetwork(name).inspect();
    return name;
  } catch {
    await docker.createNetwork({ Name: name, Driver: "bridge" });
    return name;
  }
}

/** ensure volume tồn tại */
async function ensureVolume(volumeName, labels = {}) {
  try {
    await docker.getVolume(volumeName).inspect();
    return volumeName;
  } catch {}
  await docker.createVolume({ Name: volumeName, Driver: "local", Labels: labels });
  return volumeName;
}

/** lấy IP container trong network */
async function getIP(containerName, net) {
  const inspect = await docker.getContainer(containerName).inspect();
  return inspect.NetworkSettings.Networks?.[net]?.IPAddress || null;
}

/** build fqdn */
function buildStudentFqdn({ classId, studentId }) {
  const suffix = normalizeSuffix(DOMAIN_SUFFIX);
  if (!suffix) throw new Error("DOMAIN_SUFFIX rỗng. Ví dụ: ide.example.com");
  const sub = `${slugifyDns(studentId)}-${slugifyDns(classId)}-ide`;
  return `${sub}.${suffix}`;
}

/** traefik labels */
function buildTraefikLabels({ routerKey, fqdn, networkName }) {
  return {
    "traefik.enable": "true",
    "traefik.docker.network": networkName,
    [`traefik.http.services.${routerKey}.loadbalancer.server.port`]: "8080",
    [`traefik.http.routers.${routerKey}.rule`]: `Host(\`${fqdn}\`)`,
    [`traefik.http.routers.${routerKey}.entrypoints`]: "web",
  };
}

/**
 * minio env (GitHub-flow)
 * - Container chỉ giữ cấu hình "gốc" (không attemptId).
 * - Khi giáo viên bấm Lưu/Collect, bạn sẽ override MINIO_PREFIX (có attemptId/time)
 *   lúc exec push-to-minio.
 */
function buildMinioEnv({ classId, studentId }) {
  const bucket = process.env.MINIO_BUCKET || "students";
  const classSlug = slugify(classId);
  const studentSlug = slugify(studentId);

  // Prefix gốc (KHÔNG attempt). Đến lúc collect/save sẽ append attemptId.
  // Ví dụ lúc save: submissions/<class>/<student>/<attemptId>/workspace
  const basePrefix = `submissions/${classSlug}/${studentSlug}`;

  const env = [
    `MINIO_BUCKET=${bucket}`,
    `MINIO_PREFIX=${basePrefix}`, // base only
    `WORKDIR=/workspace`,
    `ENTRYPOINTD=/entrypoint.d`,
  ];

  if (process.env.MINIO_ENDPOINT) env.push(`MINIO_ENDPOINT=${process.env.MINIO_ENDPOINT}`);
  if (process.env.MINIO_ACCESS_KEY) env.push(`MINIO_ACCESS_KEY=${process.env.MINIO_ACCESS_KEY}`);
  if (process.env.MINIO_SECRET_KEY) env.push(`MINIO_SECRET_KEY=${process.env.MINIO_SECRET_KEY}`);

  return env;
}

/** connect container vào network nếu chưa attach */
async function connectIfNotAttached(containerName, netName) {
  if (!netName) return { attached: false, reason: "no-netName" };

  const cInfo = await docker.getContainer(containerName).inspect();
  const attached = Object.prototype.hasOwnProperty.call(
    cInfo.NetworkSettings.Networks || {},
    netName
  );
  if (attached) return { attached: true, reason: "already" };

  try {
    await docker.getNetwork(netName).connect({ Container: containerName });
    return { attached: true, reason: "connected" };
  } catch (e) {
    throw new Error(`Connect ${containerName} -> ${netName} failed: ${e?.message || e}`);
  }
}

/** start container nếu đang stopped */
async function ensureRunning(containerName) {
  const c = docker.getContainer(containerName);
  const info = await c.inspect();
  if (!info.State?.Running) {
    await c.start();
  }
  return info;
}

/**
 * Tạo container theo "thiết lập image mới nhất":
 * - Nếu container tồn tại nhưng image tag khác image mong muốn => recreate
 * - Nếu đúng image => ensure running + ensure attached đủ networks
 *
 * NOTE:
 * - attemptId KHÔNG tạo ở đây. attemptId sẽ tạo khi giáo viên bấm Lưu/Collect,
 *   và truyền vào env của lệnh exec push-to-minio (override MINIO_PREFIX).
 */
export async function createStudentContainer(classId, networkName, studentId) {
  if (!classId || !studentId) throw new Error("classId và studentId là bắt buộc");
  if (!networkName) throw new Error("networkName là bắt buộc");

  const name = makeStudentContainerName(classId, studentId);
  const volumeName = makeStudentVolumeName(classId, studentId);
  const fqdn = buildStudentFqdn({ classId, studentId });
  const routerKey = makeStudentRouterKey(classId, studentId);

  const image = process.env.STUDENT_IDE_IMAGE || "code-server-minio:prefix-v2-fixed";
  const env = buildMinioEnv({ classId, studentId });

  await ensureNetwork(networkName);
  await ensureNetwork(MINIO_NET);
  await ensureVolume(volumeName, studentVolumeLabels(classId, studentId));

  const labels = {
    ...buildTraefikLabels({ routerKey, fqdn, networkName }),
    ...studentMetaLabels(classId, studentId),
  };

const createSpec = {
  Image: image,
  name,
  User: "0:0",
  WorkingDir: "/workspace",

  Entrypoint: ["/usr/bin/entrypoint.sh"],

  // CHỈ truyền args + folder cần mở
  Cmd: [
    "--bind-addr", "0.0.0.0:8080",
    "--auth", "none",
    "/workspace"
  ],

  Env: [
    ...env,
    "ENTRYPOINTD=/entrypoint.d", // bắt buộc để entrypoint.sh không chết
  ],

  ExposedPorts: { "8080/tcp": {} },
  HostConfig: {
    NetworkMode: networkName,
    Mounts: [{ Type: "volume", Source: volumeName, Target: "/workspace" }],
    RestartPolicy: { Name: "unless-stopped" },
  },
  Labels: labels,
};


  // 1) Nếu tồn tại container: nếu image khác => recreate; nếu giống => ensure
  try {
    const existing = await docker.getContainer(name).inspect();

    const currentImage = existing?.Config?.Image;
    const shouldRecreate = currentImage !== image;

    if (shouldRecreate) {
      try {
        const c = docker.getContainer(name);
        try {
          await c.stop({ t: 5 });
        } catch {}
        await c.remove({ force: true });
      } catch (e) {
        throw new Error(`Remove old container failed: ${e?.message || e}`);
      }
    } else {
      await ensureRunning(name);
      await connectIfNotAttached(name, networkName);
      await connectIfNotAttached(name, MINIO_NET);

      const ip = await getIP(name, networkName);
      return {
        name,
        ip,
        studentId,
        fqdn,
        volumeName,
        containerPath: "/workspace",
        minioBasePrefix: env.find((x) => x.startsWith("MINIO_PREFIX="))?.split("=", 2)[1],
      };
    }
  } catch {
    // container chưa tồn tại -> tạo mới bên dưới
  }

  // 2) Tạo mới
  const container = await docker.createContainer(createSpec);

  try {
    await container.start();
  } catch (e) {
    try {
      await container.remove({ force: true });
    } catch {}
    throw e;
  }

  // 3) Ensure join đủ 2 network
  await connectIfNotAttached(name, networkName);
  await connectIfNotAttached(name, MINIO_NET);

  const ip = await getIP(name, networkName);
  return {
    name,
    ip,
    studentId,
    fqdn,
    volumeName,
    containerPath: "/workspace",
    minioBasePrefix: env.find((x) => x.startsWith("MINIO_PREFIX="))?.split("=", 2)[1],
  };
}
