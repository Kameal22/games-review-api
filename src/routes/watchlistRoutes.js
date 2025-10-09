import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
  listMyWatchlist,
} from "../controllers/watchlistController.js";

const router = Router();

router.get("/me", requireAuth, listMyWatchlist); // GET /api/watchlist/me
router.post("/", requireAuth, addToWatchlist); // POST /api/watchlist
router.patch("/:id", requireAuth, updateWatchlistStatus); // PATCH /api/watchlist/:id
router.delete("/:id", requireAuth, removeFromWatchlist); // DELETE /api/watchlist/:id

export default router;
