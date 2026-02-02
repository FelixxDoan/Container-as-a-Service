import {
  getQuestionService,
  resultlService,
  resultRunService,
  submitService,
  tabeleService,
} from "../services/exam.service.js";
import handleRequest from "../utils/handleRequest.js";

const getQuestion = (req, res) => {
  handleRequest(res, async () => await getQuestionService());
};

const getResultl = (req, res) => {
  const { id } = req.body;
  handleRequest(res, async () => await resultlService(id));
};

const getResultRun = (req, res) => {
  const { query } = req.body;
  handleRequest(res, async () => await resultRunService(query));
};

const submit = (req, res) => {
  const { saved, studentId } = req.body;

  handleRequest(res, async () => await submitService(studentId, saved));
};

const getTable = (req, res) => {
  handleRequest(res, async () => await tabeleService());
};

export { getQuestion, getResultl, getResultRun, submit, getTable };
