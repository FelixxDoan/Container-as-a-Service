import express from 'express'
import multer from 'multer'
import path from 'path';

import { adminQuery , createStudentDb} from '../controllers/admin.controller.js'

const upload = multer({
  dest: path.resolve('uploads')
});

const router = express.Router()

router.post('/query', upload.single('sqlFile'), adminQuery)
router.post('/create-db', createStudentDb)

export default router   