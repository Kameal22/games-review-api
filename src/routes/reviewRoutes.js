import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createReview,
  updateReview,
  getReviews,
  listMyReviews,
  getSingleReview,
  checkReviewExists,
  fetchAndSortByHighestScore,
} from "../controllers/reviewController.js";

const router = Router();

router.get("/", requireAuth, getReviews); // GET /api/reviews
router.get("/me", requireAuth, listMyReviews); // GET /api/reviews/me
router.post("/", requireAuth, createReview); // POST /api/reviews
router.patch("/:id", requireAuth, updateReview); // PATCH /api/reviews/:id
router.get("/:id", requireAuth, getSingleReview); // GET /api/reviews/:id
router.get("/check-exists/:gameId", requireAuth, checkReviewExists); // GET /api/reviews/check-exists/:gameId
router.get("/highest-score", requireAuth, fetchAndSortByHighestScore); // GET /api/reviews/highest-score

export default router;
