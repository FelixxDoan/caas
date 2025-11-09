import { Router } from "express";
import { addUserController, deleteManyController, findUserController, updateUserController } from "../controllers/user.controller.js";

const router = Router()

router.post('/add', addUserController)
router.get('/all', findUserController)
router.put('/update', updateUserController)
router.delete('/delete', deleteManyController)

export default router