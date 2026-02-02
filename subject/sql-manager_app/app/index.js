import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import dbRoutes from "./routes/db.route.js";
import adminRoutes from './routes/admin.route.js'
import examRoutes from './routes/exam.route.js'

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();

app.use(express.json());
app.use(cors());

app.use("/subject/sql/db", dbRoutes);
app.use("/subject/sql/exam", examRoutes);
app.use("/subject/sql/admin", adminRoutes);

const PORT = process.env.APP_PORT;

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
