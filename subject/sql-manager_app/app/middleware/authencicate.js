import dotenv from "dotenv";
import { Pool } from "pg";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const poolCache = {};

const authenticate = async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ message: "No UserID provided" });

  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    if (poolCache[userId]) {
      req.pool = poolCache[userId];
      return next();
    }

    const dbName = `db_student_${userId}`;
    const newPool = new Pool({
      host: process.env.SQL_SERVICE || "localhost",
      port: 5432,
      user: "backend_user",
      password: "your_secret",
      database: dbName,
    });

    await newPool.query("SELECT 1"); // test kết nối

    poolCache[userId] = newPool;
    req.pool = newPool;

    return next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    return res.status(403).json({ message: "Invalid user or database error" });
  }
};

export default authenticate;
