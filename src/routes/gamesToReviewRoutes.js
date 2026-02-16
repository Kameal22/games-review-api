import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addToGamesToReview,
  removeFromGamesToReview,
  listMyGamesToReview,
  moveFromWatchlistToReview,
} from "../controllers/gamesToReviewController.js";

const router = Router();

router.get("/me", requireAuth, listMyGamesToReview); // GET /api/games-to-review/me
router.post("/", requireAuth, addToGamesToReview); // POST /api/games-to-review — body: { gameId: string }
router.post("/from-watchlist/:gameId", requireAuth, moveFromWatchlistToReview); // POST /api/games-to-review/from-watchlist/:gameId — Move from watchlist to review
router.delete("/:gameId", requireAuth, removeFromGamesToReview); // DELETE /api/games-to-review/:gameId

export default router;
