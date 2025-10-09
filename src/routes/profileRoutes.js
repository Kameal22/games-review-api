import { Router } from "express";
import { getMyProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getMyProfile);

export default router;
