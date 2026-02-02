import { defaultService, queryService } from "../services/db.service.js";
import handleRequest from "./../utils/handleRequest.js";

const query = (req, res) => {
  const { query } = req.body;
  const { pool } = req;

  handleRequest(res, async () => await queryService(query, pool));
};

const defaultQuery = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No SQL file uploaded" });
  }

  handleRequest(res, async () => await defaultService(req.file.path));
};

export { query, defaultQuery };
