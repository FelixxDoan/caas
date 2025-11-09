import { loginService, logoutService } from "../services/auth.service.js";
import handleRequest from "../utils/handleRequest.js";

const loginController = (req, res) => {
  const { email, password } = req.body;

  handleRequest(res, async () => await loginService({ email, password }));
};

export const logoutController = async (req, res) => {
  handleRequest(res, async () => {
    const sub = req.header("X-User-Id");
    if (!sub) {
      const err = new Error("Missing sub");
      err.httpStatus = 400;
      throw err;
    }
    return await logoutService(sub);
  });
};

export { loginController };
