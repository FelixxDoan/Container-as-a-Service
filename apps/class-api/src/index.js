import express from "express";
import morgan from "morgan";


import classRouter from './routes/class.route.js'
import subjectRouter from './routes/subject.route.js'
import roomRouter from './routes/room.route.js'
import homeworkRouter from './routes/homework.route.js'

import {connMongo} from "@micro/db/conn";

const app = express();
app.use(express.json());
app.use(morgan("dev"));


app.get("/healthz", (req, res) => res.json({ ok: true, service: "class api" }));

app.use('/class',classRouter )
app.use('/subject',subjectRouter )
app.use('/room',roomRouter )
app.use('/homework',homeworkRouter )

const PORT = process.env.PORT || 3004

connMongo()

app.listen(PORT, () => console.log(`Gateway listening on ${PORT}`));
