import { Router } from 'express';
import { changePassController, profileController } from '../controllers/user.controller.js';

const router = Router()

router.get('/profile', profileController)
router.put('/password', changePassController)

export default router