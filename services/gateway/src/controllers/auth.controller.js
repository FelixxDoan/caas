import handleRequest from "../utils/handleRequest.js";
import { loginService, logoutService } from "../services/auth.service.js";

export const TOKEN_TTL_SEC = 6 * 60 * 60 * 1000;

const loginController = (req, res) => {
  const { email, password } = req.body;
  handleRequest(res, async () => {
    const { status, data } = await loginService({ email, password });
    const { token, passChange, role } = data;
    
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_SEC * 1000,
    });

    return { status, data: { passChange, role } };
  });
};

const logoutController = (req, res) => {
  const { sub } = req.user;

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SEC,
  });

  handleRequest(res, async () => logoutService(sub));
};

export { loginController, logoutController };
