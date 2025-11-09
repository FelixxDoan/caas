// services/auth-api/src/utils/sessionLookup.js
import { redis } from "../db/connRredis.js";

const JTI_PREFIX  = "jti:";   // jti:<jti> -> sub
const SESS_PREFIX = "sess:";  // sess:<sub> -> jti (đảm bảo 1 phiên duy nhất)

export async function getSubByJti(jti, { enforceSingleSession = true } = {}) {
  if (!jti) return null;

  // jti -> sub
  const sub = await redis.get(`${JTI_PREFIX}${jti}`);
  if (!sub) return null;

  if (enforceSingleSession) {
    // đảm bảo jti đang là phiên hiện tại của sub
    const cur = await redis.get(`${SESS_PREFIX}${sub}`);
    if (cur !== jti) return null; // phiên đã bị thu hồi/ghi đè
  }

  return sub;
}
