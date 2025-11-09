import handleRequest from "./../utils/handleRequest.js";
import {
  addUserService,
  deleteManyService,
  findUserService,
  updateUserService
} from "../services/user.service.js";

const addUserController = (req, res) => {
  const { data } = req.body;
  const { role } = req.query;

  handleRequest(res, async () => await addUserService({ role, data }));
};

const findUserController = (req, res) => {
  const { role } = req.query;

  handleRequest(res, async () => await findUserService({ role }));
};

const deleteManyController = (req, res) => {
  const { role, filter } = req.query;

  handleRequest(res, async () => await deleteManyService({ role, filter }));
};

const updateUserController = (req, res) => {
  const { role, id } = req.query;
  const { fields } = req.body;

  handleRequest(res, async () => await updateUserService({ role, id, fields }));
};

export { addUserController, findUserController, deleteManyController, updateUserController };
