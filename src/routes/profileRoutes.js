import { Router } from "express";
import {
  getMyProfile,
  getUserProfile,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getMyProfile);
router.get("/:userId", requireAuth, getUserProfile);

export default router;
