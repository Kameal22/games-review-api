import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createReview,
  updateReview,
  getReviews,
  listMyReviews,
} from "../controllers/reviewController.js";

const router = Router();

router.get("/", requireAuth, getReviews); // GET /api/reviews
router.get("/me", requireAuth, listMyReviews); // GET /api/reviews/me
router.post("/", requireAuth, createReview); // POST /api/reviews
router.patch("/:id", requireAuth, updateReview); // PATCH /api/reviews/:id

export default router;
