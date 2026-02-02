import { Router } from "express";
import { getChildrenFolderController, getObjectStreamController } from "../controllers/homework.controller.js";

const router  =Router()

router.get("/folders", getChildrenFolderController)
router.get("/object", getObjectStreamController)

export default router