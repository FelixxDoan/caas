import express from "express";
import morgan from "morgan";

import connMongo from "./db/connMongo.js";
import userRouter from "./routes/user.route.js";
import subjectRouter from "./routes/subject.route.js";
import classRouter from "./routes/class.route.js";
import sessionRouter from "./routes/session.route.js";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, service: "admin-api" })
);

app.use("/admin/user", userRouter);
app.use("/admin/subject", subjectRouter);
app.use("/admin/class", classRouter);
app.use("/admin/session", sessionRouter);

connMongo();

app.listen(PORT, () => console.log(`auth-api listening on :${PORT}`));
