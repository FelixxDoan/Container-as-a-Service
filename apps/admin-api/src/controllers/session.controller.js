import {handleRequest} from "@micro/utils";
import {
  allSessionService,
  deleteAllService,
  deleteSessionBySub
} from "../services/session.service.js";

const allSessionController = (req, res) => {
  handleRequest(res, async () => await allSessionService());
};


const deleteSubSessionController = (req, res) => {
  const {sub} =req.params
  handleRequest(res, async () => await deleteSessionBySub(sub));
};

const deleteAllSessionController = (req, res) => {
  handleRequest(res, async () => await deleteAllService());
};

export { allSessionController, deleteAllSessionController, deleteSubSessionController };
