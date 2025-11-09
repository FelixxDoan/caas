import {
  allSessionService,
  deleteAllService,
} from "../services/session.service.js";
import handleRequest from "../utils/handleRequest.js";

const allSessionController = (req, res) => {
  handleRequest(res, async () => await allSessionService());
};

const deleteAllSessionController = (req, res) => {
  handleRequest(res, async () => await deleteAllService());
};

export { allSessionController, deleteAllSessionController };
