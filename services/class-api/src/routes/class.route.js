import { Router } from "express";

import {
  classActionController,
  allClassController,
  findClass,
} from "../controllers/class.controller.js";

const router = Router();

router.get('/all', allClassController)
router.get('/:code', findClass)
router.post("/:code/:action", classActionController);



export default router;
