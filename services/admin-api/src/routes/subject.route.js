import { Router } from "express";

import {
  addSubject,
  findSubject,
  findAllSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller.js";

const router = Router();

router.post("/add", addSubject);
router.get("/find", findSubject);
router.get("/all", findAllSubject);
router.put("/update", updateSubject);
router.delete("/delete", deleteSubject);

export default router;
