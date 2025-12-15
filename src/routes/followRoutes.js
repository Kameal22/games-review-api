import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from "../controllers/FollowController.js";

const router = Router();

// Specific routes must come before parameterized routes
router.get("/followers", requireAuth, getFollowers); // GET /api/follow/followers
router.get("/following", requireAuth, getFollowing); // GET /api/follow/following
router.get("/:displayName/status", requireAuth, getFollowStatus); // GET /api/follow/:displayName/status
router.post("/:displayName", requireAuth, followUser); // POST /api/follow/:displayName
router.delete("/:displayName", requireAuth, unfollowUser); // DELETE /api/follow/:displayName

export default router;
