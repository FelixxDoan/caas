import { Router } from "express";
import {
  allSessionController,
  deleteAllSessionController,
} from "../controllers/session.controller.js";

const router = Router();

router.get("/all", allSessionController);

router.delete("/all", deleteAllSessionController);

export default router;
