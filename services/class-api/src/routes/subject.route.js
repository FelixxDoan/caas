import { Router } from "express";

import {
  findSubject,
} from "../controllers/subject.controller.js";

const router = Router();

router.get("/find", findSubject);

export default router;
