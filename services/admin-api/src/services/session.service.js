import {
  listAllSessions,
  revokeBySub,
  revokeAllSessions,
  revokeByJti,
} from "../utils/sessionStore.js";

const allSessionService = async () => {
  const items = await listAllSessions();
  return { total: items.length, items };
};

const deleteSessionBySub = async (sub) => {
  const ok = await revokeBySub(sub);
  return { deleted: ok ? 1 : 0 };
};

const deleteSessionByJti = async (jti) => {
  const ok = await revokeByJti(jti);
  return { deleted: ok ? 1 : 0 };
};

const deleteSessionByArr = async (subs) => {
  if (!Array.isArray(subs) || !subs.length)
    return res.status(400).json({ message: "subs required" });
  let deleted = 0;
  for (const s of subs) if (await revokeBySub(String(s))) deleted++;

  return { deleted };
};

const deleteAllService = async () => {
  const n = await revokeAllSessions();
  return { deleted: n };
};

export {
  allSessionService,
  deleteSessionBySub,
  deleteSessionByJti,
  deleteSessionByArr,
  deleteAllService,
};
