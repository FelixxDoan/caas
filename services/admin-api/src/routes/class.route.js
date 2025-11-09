import { Router } from "express";

import {
  addClass,
  findClass,
  allClass,
  updateClass,
  deleteClass,
  removeFieldsController,
} from "../controllers/class.controller.js";

const router = Router();

router.post("/add", addClass);
router.get("/find", findClass);
router.get("/all", allClass);
router.put("/update", updateClass);
router.delete("/delete", deleteClass);
router.patch("/remove-fields", removeFieldsController);

export default router;
