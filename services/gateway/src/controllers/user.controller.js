// gateway/src/controllers/user.controller.js
import handleRequest from "../utils/handleRequest.js";
import {
  userProfileService,
  userChangePassService,
} from "../services/user.service.js";

export const getProfileController = (req, res) => {
  const { user_id } = req.user;
  return handleRequest(res, async () => userProfileService(user_id));
};

export const changePasswordController = (req, res) => {
  const { user_id } = req.user;
  const { currPass, newPass } = req.body;

  return handleRequest(res, async () =>
    userChangePassService({ user_id, currPass, newPass })
  );
};
