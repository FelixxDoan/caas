import { Router } from "express";
import {
  getProfileController,
  changePasswordController,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.get("/profile", authenticate, getProfileController);
router.put("/change-password", authenticate, changePasswordController);

export default router;
