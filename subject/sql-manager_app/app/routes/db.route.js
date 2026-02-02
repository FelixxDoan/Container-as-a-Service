import express from "express";
import multer from 'multer'
import path from 'path';

import { defaultQuery, query } from "../controllers/db.controller.js";
import authenticate from './../middleware/authencicate.js';

const upload = multer({
  dest: path.resolve('uploads')
});

const router = express.Router();

router.post('/query-default', upload.single('sqlFile'), defaultQuery)
router.post("/query", authenticate, query);

export default router;
