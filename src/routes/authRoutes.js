import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { registrationProtection } from "../middleware/registrationProtection.js";

const router = Router();

router.post("/register", registrationProtection, register);
router.post("/login", login);

export default router;
