import { Router } from "express";
import {
  allSessionController,
  deleteAllSessionController,
  deleteSubSessionController
} from "../controllers/session.controller.js";

const router = Router();

router.get("/", allSessionController);

router.delete("/:sub", deleteSubSessionController);
router.delete("/", deleteAllSessionController);

export default router;
