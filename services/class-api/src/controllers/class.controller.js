// controllers/class.controller.js
import handleRequest from "../utils/handleRequest.js";
import {
  classAction,
  allClassService,
  findActiveClassByCode,
} from "../services/class.service.js";

export const allClassController = (req, res) => {
  handleRequest(res, async () => await allClassService());
};

export const findClass = (req, res) => {
  const { code } = req.params;

  handleRequest(res, async () => await findActiveClassByCode(code));
};

// Controller gộp (role: "student" | "teacher", action: "join" | "leave")
export const classActionController = async (req, res) => {
  const role = req.header("X-User-Role");
  const ref_profile = req.header("X-User-Profile");
  const { code, action } = req.params;
  handleRequest(
    res,
    async () => await classAction({ role, code, ref_profile, action })
  );
};
