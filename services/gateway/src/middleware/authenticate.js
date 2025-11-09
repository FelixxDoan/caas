// gateway/src/middlewares/authenticate.js
import jwt from "jsonwebtoken";
import { redis } from "../utils/connRredis.js";

const SESS_PREFIX = "sess:"; // sess:<sub> -> jti (current session id)
const JWT_SECRET = process.env.JWT_SECRET || "Fi123581321";

function getTokenFromReq(req) {
  const fromCookie = req.cookies?.token;
  if (fromCookie) return fromCookie;

  const auth = req.headers["authorization"];
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer") return null;
  return token || null;
}

export async function authenticate(req, res, next) {
  const token = getTokenFromReq(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthenticated" });
  }
  try {
    // Verify JWT
    const payload = jwt.verify(token, JWT_SECRET);

    const key = `${SESS_PREFIX}${payload.sub}`;
    const jtiInRedis = await redis.get(key);
    if (!jtiInRedis || jtiInRedis !== payload.jti) {
      return res.status(401).json({ message: "Session revoked" });
    }

    req.user = {
      sub: payload.sub,
      role: payload.role,
      jti: payload.jti,
      user_id: payload.user_id
    };

    return next();
  } catch (err) {
    // Token hết hạn / sai / hỏng
    const isExpired = err?.name === "TokenExpiredError";
    return res.status(401).json({
      message: isExpired ? "Token expired" : "Invalid token",
    });
  }
}

/** Headers tiện lợi để forward xuống service nội bộ (zero-trust ở gateway) */
export function userHeaders(req) {
  if (!req.user) return {};
  return {
    "X-User-Id": req.user.sub,
    "X-User-Role": req.user.role,
    "X-User-Jti": req.user.jti,
    "X-User-ProfileModel": req.user.profileModel || "",
    "X-User-RefProfile": req.user.ref_profile || "",
  };
}
