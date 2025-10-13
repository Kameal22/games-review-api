import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createReview,
  updateReview,
  getReviews,
} from "../controllers/reviewController.js";

const router = Router();

router.get("/", requireAuth, getReviews); // GET /api/reviews
router.post("/", requireAuth, createReview); // POST /api/reviews
router.patch("/:id", requireAuth, updateReview); // PATCH /api/reviews/:id

export default router;
