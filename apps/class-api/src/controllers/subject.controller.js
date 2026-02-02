import {handleRequest} from "@micro/utils";

import { findSubjectService } from "../services/subject.service.js";

const findSubject = (req, res) => {
  const { id } = req.query;

  handleRequest(res, async () => await findSubjectService(id));
};
export { findSubject };
