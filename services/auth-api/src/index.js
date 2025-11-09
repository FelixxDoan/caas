// auth-api/server.js
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import connMongo from "./db/connMongo.js";
import authRouter from "./routes/auth.route.js";
import verifyRouter from "./routes/verify.route.js";

const app = express();
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

/** 1) VERIFY: KHÔNG áp CORS (Traefik gọi trực tiếp) */
app.use("/verify", verifyRouter);

/** 2) CORS chỉ cho các route mà browser sẽ gọi (vd: /auth) */
const allowedOrigins = [
  // Dev local
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // App/containers trên .test
  // Có thể thêm https:// nếu dùng TLS
];

const corsOriginFn = (origin, cb) => {
  // Cho phép không có Origin (curl, health check, Traefik khi ẩn Origin)
  if (!origin) return cb(null, true);

  // Cho mọi subdomain .test
  if (/^https?:\/\/([a-z0-9-]+\.)*test(?::\d+)?$/i.test(origin)) {
    return cb(null, true);
  }

  // Cho localhost dev
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin)) {
    return cb(null, true);
  }

  // Tuỳ chọn: cho tên nội bộ
  if (origin === "http://traefik" || origin === "http://gateway") {
    return cb(null, true);
  }

  return cb(new Error("Not allowed by CORS"));
};

const corsOpts = {
  origin: corsOriginFn,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    // Thêm các header Traefik/Auth có thể dùng:
    "X-Container-Name",
    "X-Session-Jti",
    "X-Forwarded-For",
    "X-Forwarded-Host",
    "X-Forwarded-Proto",
  ],
  credentials: true,
  maxAge: 600, // preflight cache 10'
};

// Áp CORS CHỈ CHO /auth
app.use("/auth", cors(corsOpts), authRouter);
// (tùy chọn) handle preflight cho /auth
app.options("/auth/*", cors(corsOpts));

/** 3) Healthz */
app.get("/healthz", (_req, res) => res.json({ ok: true, service: "auth-api" }));

/** 4) Kết nối DB & listen */
connMongo();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`auth-api listening on :${PORT}`));
