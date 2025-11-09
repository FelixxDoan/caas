import { changePass, profileService } from "../services/user.service.js";
import handleRequest from "../utils/handleRequest.js";

const profileController = (req, res) => {
  const sub = req.header("X-User-Id");

  handleRequest(res, async () => await profileService(sub));
};

const changePassController = (req, res) => {
  const sub = req.header("X-User-Id");
  const { currPass, newPass } = req.body;

  handleRequest(res, async () => await changePass({ sub, currPass, newPass }));
};

export { profileController, changePassController };
