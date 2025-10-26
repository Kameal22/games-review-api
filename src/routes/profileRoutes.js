import { Router } from "express";
import {
  getMyProfile,
  getUserProfile,
  updateUserBio,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getMyProfile);
router.get("/:userId", requireAuth, getUserProfile);
router.put("/bio", requireAuth, updateUserBio);

export default router;
