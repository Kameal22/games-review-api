import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createReview,
  updateReview,
  getReviews,
  listUserReviews,
} from "../controllers/reviewController.js";

const router = Router();

router.get("/", requireAuth, getReviews); // GET /api/reviews
router.get("/user/:userId", requireAuth, listUserReviews); // GET /api/reviews/user/:userId
router.post("/", requireAuth, createReview); // POST /api/reviews
router.patch("/:id", requireAuth, updateReview); // PATCH /api/reviews/:id

export default router;
