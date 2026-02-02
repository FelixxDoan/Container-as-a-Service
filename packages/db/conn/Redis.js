import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

export const redis = createClient({ url: REDIS_URL });

let inited = false;
let connecting = null;

export default async function connRedis() {
  if (!inited) {
    redis.on("error", (err) => console.error("Redis error:", err));
    inited = true;
  }

  if (redis.isOpen) return redis;       // đã connect xong
  if (connecting) return connecting;    // đang connect thì đợi chung

  connecting = redis.connect()
    .then(() => redis)
    .finally(() => { connecting = null; });

  return connecting;
}
