// gateway/src/server.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import classRouter from "./routes/class.route.js";
import subjectRouter from "./routes/subject.route.js";
import roomRouter from "./routes/room.route.js";

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());

const allowList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use("/api", cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowList.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
}));
app.options("/api/*", cors());

// Health
app.get("/healthz", (req,res)=> res.json({ ok:true, service:"gateway" }));

// Routers
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/class", classRouter);
app.use("/api/subject", subjectRouter);
app.use("/api/room", roomRouter);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Gateway listening on ${PORT}`));
