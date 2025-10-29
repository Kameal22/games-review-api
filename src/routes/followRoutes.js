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
router.get("/:userId/status", requireAuth, getFollowStatus); // GET /api/follow/:userId/status
router.post("/:userId", requireAuth, followUser); // POST /api/follow/:userId
router.delete("/:userId", requireAuth, unfollowUser); // DELETE /api/follow/:userId

export default router;
