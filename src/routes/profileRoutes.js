import { Router } from "express";
import {
  getMyProfile,
  getUserProfile,
  updateUserBio,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getMyProfile);
// Fetch profile by displayName instead of userId
router.get("/:displayName", requireAuth, getUserProfile);
router.put("/bio", requireAuth, updateUserBio);

export default router;
