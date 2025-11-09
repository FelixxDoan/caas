import { Router } from 'express';
import { downClassController, upClassController } from '../controllers/room.controller.js';

const router = Router()

router.post('/up-class', upClassController)
router.post('/down-class', downClassController)

export default router