import express from "express";
import morgan from "morgan";

import { connMongo, connRedis } from "@micro/db/conn";
import userRouter from "./routes/user.route.js";
import subjectRouter from "./routes/subject.route.js";
import classRouter from "./routes/class.route.js";
import sessionRouter from "./routes/session.route.js";
import homeworkRouter from "./routes/homework.route.js";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, service: "admin-api" })
);

app.get("/chekk", (_req, res) => res.json({ ok: true, service: "okk-api" }));

app.use("/admin/user", userRouter);
app.use("/admin/subject", subjectRouter);
app.use("/admin/class", classRouter);
app.use("/admin/session", sessionRouter);
app.use("/admin/homework", homeworkRouter);

connMongo();
await connRedis();

app.listen(PORT, () => console.log(`admin-api listening on :${PORT}`));
