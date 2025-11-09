// services/auth-api/src/sessionStore.js
import { redis } from "../db/connRredis.js";
const SESS_PREFIX = "sess:";     // sess:<sub> -> jti
const JTI_PREFIX  = "jti:";      // jti:<jti>  -> sub (reverse index)
const INDEX_KEY   = "sess:index"; // Set các sub đang có phiên

/** Đặt chỗ phiên bằng placeholder, chỉ khi CHƯA có phiên (NX). Trả về jtiTemp. */
export async function reserveSession(sub, ttlSec) {
  const key = `${SESS_PREFIX}${sub}`;
  const jtiTemp = `PENDING-${Date.now()}`;
  const ok = await redis.set(key, jtiTemp, { NX: true, EX: ttlSec });
  return ok === "OK" ? jtiTemp : null; // null = đã có phiên
}

/** Nâng từ placeholder -> jti thật (id phiên), giữ TTL. An toàn bằng so khớp placeholder. */
export async function commitSession(sub, jti, ttlSec, expectedTemp) {
  const key = `${SESS_PREFIX}${sub}`;
  const current = await redis.get(key);
  if (current !== expectedTemp) return false; // mismatch: có gì đó thay đổi

  // Ghi jti thật + TTL
  await redis.set(key, jti, { EX: ttlSec });

  // Ghi reverse index + index liệt kê (tùy chọn nhưng nên có)
  await redis.set(`${JTI_PREFIX}${jti}`, sub, { EX: ttlSec });
  await redis.sAdd(INDEX_KEY, sub);

  return true;
}

/** Lấy jti phiên đang lưu cho sub (userId). */
export function getSessionJti(sub) {
  return redis.get(`${SESS_PREFIX}${sub}`);
}

/** Xoá phiên theo sub (và dọn index). Trả true nếu đã xoá. */
export async function revokeBySub(sub) {
  const sessKey = `${SESS_PREFIX}${sub}`;
  const jti = await redis.get(sessKey);
  const n = await redis.del(sessKey);
  if (jti) await redis.del(`${JTI_PREFIX}${jti}`);
  await redis.sRem(INDEX_KEY, sub);
  return n > 0;
}

/** Xoá phiên khi chỉ biết jti (reverse lookup). */
export async function revokeByJti(jti) {
  const sub = await redis.get(`${JTI_PREFIX}${jti}`);
  if (!sub) return false;
  return revokeBySub(sub);
}

/** Liệt kê tất cả phiên: [{ sub, jti, ttl }] — ưu tiên đọc từ index. */
export async function listAllSessions() {
  const subs = await redis.sMembers(INDEX_KEY);
  const out = [];

  if (subs.length) {
    const pipeline = redis.multi();
    subs.forEach((s) => pipeline.get(`${SESS_PREFIX}${s}`));
    subs.forEach((s) => pipeline.ttl(`${SESS_PREFIX}${s}`));
    const results = await pipeline.exec();
    const half = results.length / 2;

    subs.forEach((sub, i) => {
      const jti = results[i];
      const ttl = results[half + i];
      if (jti && ttl >= 0) out.push({ sub, jti, ttl });
      else {
        // dọn rác index nếu key session đã mất
        redis.sRem(INDEX_KEY, sub).catch(() => {});
      }
    });
    return out;
  }

  // Fallback nếu chưa có index: SCAN toàn bộ
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, { MATCH: `${SESS_PREFIX}*`, COUNT: 200 });
    if (keys.length) {
      const pipe = redis.multi();
      keys.forEach((k) => pipe.get(k));
      keys.forEach((k) => pipe.ttl(k));
      const rs = await pipe.exec();
      const half2 = rs.length / 2;
      keys.forEach((k, idx) => {
        const sub = k.slice(SESS_PREFIX.length);
        const jti = rs[idx];
        const ttl = rs[half2 + idx];
        if (jti && ttl >= 0) out.push({ sub, jti, ttl });
      });
    }
    cursor = next;
  } while (cursor !== "0");

  return out;
}

/** Xoá toàn bộ phiên (dọn key + index). Trả về số phiên xoá. */
export async function revokeAllSessions() {
  const items = await listAllSessions();
  if (!items.length) return 0;
  const pipe = redis.multi();
  items.forEach(({ sub, jti }) => {
    pipe.del(`${SESS_PREFIX}${sub}`);
    if (jti) pipe.del(`${JTI_PREFIX}${jti}`);
    pipe.sRem(INDEX_KEY, sub);
  });
  await pipe.exec();
  return items.length;
}
