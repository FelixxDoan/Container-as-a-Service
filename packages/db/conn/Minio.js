// db/connMinIo.js
import { Client } from "minio";

const endPoint = (process.env.MINIO_SERVICE || "minio")

const port = Number(process.env.MINIO_PORT || 9000);
const useSSL = String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";

const minio = new Client({
  endPoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
  region: process.env.MINIO_REGION || "",
  pathStyle: true,
});

export default minio