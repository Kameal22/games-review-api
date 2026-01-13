import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  likeReview,
  dislikeReview,
  removeInteraction,
  getMyInteraction,
} from "../controllers/reviewInteractionController.js";

const router = Router();

router.post("/:reviewId/like", requireAuth, likeReview); // POST /api/reviews/:reviewId/like
router.post("/:reviewId/dislike", requireAuth, dislikeReview); // POST /api/reviews/:reviewId/dislike
router.delete("/:reviewId/interaction", requireAuth, removeInteraction); // DELETE /api/reviews/:reviewId/interaction
router.get("/:reviewId/interaction", requireAuth, getMyInteraction); // GET /api/reviews/:reviewId/interaction

export default router;
