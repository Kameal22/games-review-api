import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlistByGame,
  listMyWatchlist,
  markAsBought,
  markAsUnbought,
} from "../controllers/watchlistController.js";

const router = Router();

router.get("/me", requireAuth, listMyWatchlist); // GET /api/watchlist/me
router.post("/", requireAuth, addToWatchlist); // POST /api/watchlist
router.patch("/:id", requireAuth, updateWatchlistStatus); // PATCH /api/watchlist/:id
router.delete("/:gameId", requireAuth, removeFromWatchlistByGame); // DELETE /api/watchlist/:gameId
router.patch("/:gameId/bought", requireAuth, markAsBought); // PATCH /api/watchlist/:gameId/bought
router.patch("/:gameId/unbought", requireAuth, markAsUnbought); // PATCH /api/watchlist/:gameId/unbought

export default router;
