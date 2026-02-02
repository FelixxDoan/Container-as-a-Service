import { Pool } from "pg";

const poolDefault = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER_DEFAULT || "readonly_user",
  password: process.env.PG_PASSWORD || "readonly_pass",
  database: process.env.PG_DB || "w3school",
});

const adminPool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  user: process.env.PG_USER_ADMIN || "postgres",
  password: process.env.PG_PASSWORD || "secret",
  database: process.env.PG_DB || "postgres",
});

const examPool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: 5432,
  user: process.env.PG_USER_EXAM || "student_exam",
  password: process.env.PG_PASSWORD_EXAM || "123456",
  database: process.env.PG_DB || "exam",
});

export { poolDefault, adminPool, examPool };
