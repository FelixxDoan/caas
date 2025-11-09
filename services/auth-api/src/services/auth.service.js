// services/auth-api/src/services/auth.service.js
import { redis } from "../db/connRredis.js";

import User from "../model/user.js";
import { comparePass } from "../utils/hashPassword.js";
import { signToken, TOKEN_TTL_SEC } from "../utils/generateToken.js";
import { reserveSession, commitSession } from "../utils/sessionStore.js";

const SESS_PREFIX = "sess:";
const JTI_PREFIX = "jti:";
const INDEX_KEY = "sess:index";

export const loginService = async ({ email, password }) => {
  // [0] Validate cơ bản
  if (!email || !password) {
    const err = new Error("Please fill all fields");
    err.httpStatus = 400;
    throw err;
  }

  // [1] Tìm user + lean cho nhẹ
  const user = await User.findOne({ email }).lean();
  if (!user) {
    const err = new Error("User not exist !!");
    err.httpStatus = 404;
    throw err;
  }

  // [2] So khớp pass
  const ok = await comparePass(password, user.password);
  if (!ok) {
    const err = new Error("Wrong pass !!");
    err.httpStatus = 401;
    throw err;
  }

  // [3] Chuẩn bị payload
  const sub = String(user.ref_profile);
  const payload = {
    sub,
    role: user.role,
    user_id: user._id
  };

  // [4] Đặt chỗ phiên (1 user = 1 phiên) — nếu có phiên sẵn => 409
  const jtiTemp = await reserveSession(sub, TOKEN_TTL_SEC);
  if (!jtiTemp) {
    const err = new Error("User already has an active session");
    err.httpStatus = 409;
    throw err;
  }

  // [5] Ký JWT thật + commit jti
  try {
    const { token, jti } = signToken({ sub, payload });
    const okCommit = await commitSession(sub, jti, TOKEN_TTL_SEC, jtiTemp);
    if (!okCommit) {
      const err = new Error("Session reservation mismatch");
      err.httpStatus = 500;
      throw err;
    }

    return {
      token,
      role: user.role,
      passChange: user.passChange,
    };
  } catch (e) {
    // nếu muốn rollback khi lỗi, có thể gọi revokeBySub(sub)
    throw e;
  }
};

export const logoutService = async (sub) => {
  const sessKey = `${SESS_PREFIX}${sub}`;
  const jti = await redis.get(sessKey);

  const multi = redis.multi();
  multi.del(sessKey); // xoá sess:<sub>
  multi.sRem(INDEX_KEY, sub); // bỏ khỏi index (nếu bạn có dùng set index)
  if (jti) multi.del(`${JTI_PREFIX}${jti}`); // xoá reverse index jti:<jti>

  await multi.exec();

  return { message: "Logged out" };
};
