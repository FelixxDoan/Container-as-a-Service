import fs from "fs/promises";


import { poolDefault } from "../db/connPostgre.js";

const queryService = async (query, pool) => {
  return await pool.query(query);
};

const defaultService = async (filePath) => {
  const sqlContent = await fs.readFile(filePath, "utf8");
  await fs.unlink(filePath);


  const sqlStatements = sqlContent
    .split(/;\s*(?:--.*)?$/gm) 
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  const results = [];

  for (const stmt of sqlStatements) {
    try {
      const result = await poolDefault.query(stmt);
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

export { queryService, defaultService };
