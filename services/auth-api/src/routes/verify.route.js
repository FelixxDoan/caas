import { Router } from "express";
import { getSubByJti } from "../utils/sessionLookup.js";

const router = Router();

const COOKIE_NAME = "session";   // cookie chứa chính jti
const COOKIE_DOMAIN = ".test";   // cùng eTLD+1 với container
const COOKIE_AGE_MS = 2 * 60 * 60 * 1000; // 2h


router.get("/check", async (req, res) => {
  // 1) danh tính container
  const nameC = req.get("X-Container-Name") || "";
  const studentId = nameC.split("-").pop();

  const rawCookie = req.get("cookie") || "";
  const jtiFromCookie =
    (rawCookie.match(/(?:^|;\s*)session=([^;]+)/) || [])[1] || "";

  if (jtiFromCookie) {
    const sub = await getSubByJti(jtiFromCookie);
    if (sub && sub === studentId) {
      return res.sendStatus(204); // hợp lệ -> cho đi tiếp
    }
    // không hợp lệ -> rơi xuống nhánh jti từ query để thử lại
  }

  const fwdUri = req.get("X-Forwarded-Uri") || ""; // "/enter?jti=abc"
  const url = new URL("http://dummy" + fwdUri);
  const jti = url.searchParams.get("jti");

  if (!jti) return res.status(401).json({ message: "Missing session !" });

  const sub = await getSubByJti(jti);
  if (!sub) return res.status(401).json({ message: "Session expired" });
  if (studentId !== sub)
    return res.status(401).json({ message: "Not your container!!" });

  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, jti, {
    httpOnly: true,
    sameSite: "Lax", // tab mới → OK
    secure: isProd, // HTTPS thì true
    domain: COOKIE_DOMAIN,
    path: "/",
    maxAge: COOKIE_AGE_MS,
  });

  return res.sendStatus(204); // 2xx -> Traefik cho đi tiếp
});

export default router;
