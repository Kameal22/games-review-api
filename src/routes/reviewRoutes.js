import { Router } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import {
  createReview,
  createQuickReview,
  updateReview,
  deleteReview,
  getReviews,
  listMyReviews,
  getSingleReview,
  checkReviewExists,
  fetchAndSortTenByHighestScore,
} from "../controllers/reviewController.js";
import reviewInteractionRoutes from "./reviewInteractionRoutes.js";

const router = Router();

router.get("/", optionalAuth, getReviews); // GET /api/reviews (public)
router.get("/me", requireAuth, listMyReviews); // GET /api/reviews/me (requires auth)
router.get("/highest-score", optionalAuth, fetchAndSortTenByHighestScore); // GET /api/reviews/highest-score (public)
router.get("/check-exists/:gameId", requireAuth, checkReviewExists); // GET /api/reviews/check-exists/:gameId (requires auth - checks "my" review)
router.post("/", requireAuth, createReview); // POST /api/reviews (requires auth)
router.post("/quick-review", requireAuth, createQuickReview); // POST /api/reviews/quick-review (requires auth)

// Review interaction routes (like/dislike) - must come before /:id routes
router.use("/", reviewInteractionRoutes);

router.patch("/:id", requireAuth, updateReview); // PATCH /api/reviews/:id (requires auth)
router.delete("/:id", requireAuth, deleteReview); // DELETE /api/reviews/:id (requires auth)
router.get("/:id", optionalAuth, getSingleReview); // GET /api/reviews/:id (public)

export default router;
