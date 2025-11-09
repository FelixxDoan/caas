import { Router } from "express";

import { authenticate } from "../middleware/authenticate.js";
import {
  allClassController,
  actionClassController,
  findClassController,
} from "../controllers/class.controller.js";

const router = Router();

router.get("/all", authenticate, allClassController);
router.get("/:code", authenticate, findClassController);


router.post("/action", authenticate, actionClassController);



export default router;
