import { Router } from "express";
import {
  getMyProfile,
  getUserProfile,
  updateUserBio,
} from "../controllers/profileController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getMyProfile); // GET /api/profile (requires auth - "my" profile)
router.put("/bio", requireAuth, updateUserBio); // PUT /api/profile/bio (requires auth)
router.get("/:displayName", optionalAuth, getUserProfile); // GET /api/profile/:displayName (public)

export default router;
