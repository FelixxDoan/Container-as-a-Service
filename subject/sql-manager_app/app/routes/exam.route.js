import express from "express";
import { getQuestion, getResultl, getResultRun, getTable, submit } from "../controllers/exam.controller.js";

const router = express.Router()

router.get('/question', getQuestion)
router.post('/query', getResultl)
router.post('/query-run', getResultRun)
router.post('/submit', submit)
router.get('/table', getTable)

export default router