import { Router } from "express";
import {
  getMyProfile,
  getUserProfile,
  updateUserBio,
} from "../controllers/profileController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getMyProfile); // GET /api/profile (optional auth - "my" profile when logged in)
router.put("/bio", optionalAuth, updateUserBio); // PUT /api/profile/bio (optional auth)
router.get("/:displayName", optionalAuth, getUserProfile); // GET /api/profile/:displayName (public)

export default router;
