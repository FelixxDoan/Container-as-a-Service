import { runSqlFromFile, createDbService } from "../services/admin.service.js";
import handleRequest from "../utils/handleRequest.js";

const adminQuery = (req, res) => {
  const { dbName } = req.body;

  if (!req.file || !dbName) {
    return res
      .status(400)
      .json({ error: "No SQL file uploaded or name of db" });
  }

  handleRequest(res, async () => await runSqlFromFile(req.file.path, dbName));
};

const createStudentDb = (req, res) => {
  const { StudentIds, templateDb } = req.body;

  if (!Array.isArray(StudentIds) || !templateDb) {
    return res.status(400).json({ error: "Thiếu thông tin" });
  }

  handleRequest(res, async () => await createDbService(StudentIds, templateDb));
};

export { adminQuery, createStudentDb };
