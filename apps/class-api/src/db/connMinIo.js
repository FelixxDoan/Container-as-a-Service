// db/connMinIo.js
import { Client } from "minio";

const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";

export const minio = new Client({
  endPoint: process.env.MINIO_SERVICE,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
  region: process.env.MINIO_REGION || "",
  pathStyle: true,
});

export async function ensureBucket(bucket) {
  const name = String(bucket || "").trim();
  if (!name) throw new Error("ensureBucket(bucket): bucket name is required");

  try {
    const exists = await minio.bucketExists(name).catch(() => false);
    if (!exists) await minio.makeBucket(name);
    return true;
  } catch (e) {
    console.error("[minio] ensureBucket failed:", {
      endPoint,
      port,
      useSSL,
      bucket: name,
      code: e?.code,
      message: e?.message,
    });
    throw e;
  }
}
