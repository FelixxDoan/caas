// services/auth-api/src/sessionStore.js
import { redis } from "../db/connRredis.js";
const SESS_PREFIX = "sess:"; // sess:<sub> -> jti
const JTI_PREFIX = "jti:"; // jti:<jti>  -> sub (reverse index)
const INDEX_KEY = "sess:index"; // Set các sub đang có phiên

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

export async function listAllSessions() {
  const subs = await redis.sMembers(INDEX_KEY);
  const out = [];

  if (subs.length) {
    const pipe = redis.multi();
    subs.forEach((s) => pipe.get(`${SESS_PREFIX}${s}`));
    subs.forEach((s) => pipe.ttl(`${SESS_PREFIX}${s}`));
    const rs = await pipe.exec();
    const half = rs.length / 2;

    subs.forEach((sub, i) => {
      const jti = rs[i];
      const ttl = rs[half + i];
      if (jti && ttl >= 0) out.push({ sub, jti, ttl });
      else redis.sRem(INDEX_KEY, sub).catch(() => {});
    });

    return out;
  }

  // Không có index -> duyệt bằng iterator
  const keys = [];
  for await (const key of redis.scanIterator({
    MATCH: `${SESS_PREFIX}*`,
    COUNT: 200,
  })) {
    keys.push(key);
  }

  if (keys.length) {
    const pipe = redis.multi();
    keys.forEach((k) => pipe.get(k));
    keys.forEach((k) => pipe.ttl(k));
    const rs = await pipe.exec();
    const half = rs.length / 2;

    keys.forEach((k, i) => {
      const sub = k.slice(SESS_PREFIX.length);
      const jti = rs[i];
      const ttl = rs[half + i];
      if (jti && ttl >= 0) out.push({ sub, jti, ttl });
    });
  }

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
