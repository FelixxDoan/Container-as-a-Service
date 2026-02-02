import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getFoldersController, getObjectStreamController } from "../controllers/homework.controller.js";

const r = Router();

r.get('/folders', authenticate, getFoldersController)

r.get('/object', authenticate, getObjectStreamController)

export default r;