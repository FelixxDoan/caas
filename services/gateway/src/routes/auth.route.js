import { Router } from 'express';
import { loginController, logoutController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router()

router.post('/login', loginController)
router.post('/logout', authenticate, logoutController)

export default router