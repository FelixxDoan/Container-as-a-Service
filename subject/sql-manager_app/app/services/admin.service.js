import fs from "fs/promises";

import { adminPool } from "../db/connPostgre.js";
import getPoolForDB from "../middleware/poolAdmin.js";

const runSqlFromFile = async (filePath, dbName) => {
  const sqlContent = await fs.readFile(filePath, "utf8");
  await fs.unlink(filePath);

  const pool = getPoolForDB(dbName);

  const sqlStatements = sqlContent
    .split(/;\s*(?:--.*)?$/gm)
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  const results = [];

  for (const stmt of sqlStatements) {
    try {
      const result = await pool.query(stmt);
      results.push({
        statement: stmt,
        rowCount: result.rowCount,
        fields: result.fields?.map((f) => f.name),
        rows: result.rows || [],
      });
    } catch (err) {
      results.push({
        statement: stmt,
        error: err.message,
      });
    }
  }

  return { queries: results };
};

const createDbService = async (studentIds, templateDb) => {
  const classUser = `${templateDb}_user`;
  const classPass = "class_password"; // bạn có thể random nếu muốn

  // ✅ Kiểm tra user lớp đã tồn tại chưa
  const checkUser = await adminPool.query(
    `SELECT 1 FROM pg_roles WHERE rolname = $1`,
    [classUser]
  );

  // ✅ Nếu chưa tồn tại thì tạo user
  if (checkUser.rowCount === 0) {
    await adminPool.query(`CREATE USER "${classUser}" WITH PASSWORD $1`, [
      classPass,
    ]);
  }

  for (const id of studentIds) {
    const dbName = `student_${id}`;

    // ✅ Tạo DB từ template
    await adminPool.query(
      `CREATE DATABASE "${dbName}" TEMPLATE "${templateDb}";`
    );

    // ✅ Kết nối vào DB sinh viên để phân quyền
    const studentDb = new Pool({
      user: "postgres",
      host: "localhost",
      password: "your_admin_password",
      port: 5432,
      database: dbName,
    });

    // ✅ Cấp quyền cho user lớp trong DB sinh viên
    await studentDb.query(
      `GRANT CONNECT ON DATABASE "${dbName}" TO "${classUser}";`
    );
    await studentDb.query(`GRANT USAGE ON SCHEMA public TO "${classUser}";`);
    await studentDb.query(
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${classUser}";`
    );
    await studentDb.query(
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${classUser}";`
    );

    await studentDb.end();
  }

  return {
    message: `Đã tạo ${studentIds.length} database từ template '${templateDb}' và phân quyền cho user '${classUser}'`,
    user: classUser,
    password: classPass,
  };
};

export { runSqlFromFile, createDbService };
