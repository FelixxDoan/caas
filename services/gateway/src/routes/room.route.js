import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { upClass, downClass, enterClass } from "../controllers/room.controller.js";

const router = Router();

router.post("/up-class", authenticate, upClass);
router.post("/down-class", authenticate, downClass);

router.post("/enter-class", authenticate, enterClass);


export default router;
