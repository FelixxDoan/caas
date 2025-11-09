// services/auth-api/src/redis.js
import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
export const redis = createClient({ url: REDIS_URL });

redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();
