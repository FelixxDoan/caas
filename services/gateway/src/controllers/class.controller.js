// controllers/class.controller.js
import handleRequest from "../utils/handleRequest.js";
import {
  allClassService,
  actionClassByRoleService,
  finClassService,
} from "../services/class.service.js";

export const allClassController = (req, res) => {
  handleRequest(res, async () => await allClassService());
};

export const findClassController = (req, res) => {
  const { code } = req.params;

  handleRequest(res, async () => await finClassService(code));
};

export const actionClassController = (req, res) => {
  const { classCode: code, action } = req.body;
  const { sub, role } = req.user;

  handleRequest(
    res,
    async () => await actionClassByRoleService({ code, action, sub, role })
  );
};
