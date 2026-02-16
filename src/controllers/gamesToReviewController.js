import mongoose from "mongoose";
import { z } from "zod";
import GamesToReview from "../models/GamesToReview.js";
import Watchlist from "../models/Watchlist.js";

const addSchema = z.object({
  gameId: z.string(),
});

export async function addToGamesToReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });

    const { gameId } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(gameId))
      return res.status(400).json({ message: "Invalid gameId" });

    const entry = await GamesToReview.findOneAndUpdate(
      { user: userId, game: gameId },
      {
        $setOnInsert: {
          user: userId,
          game: gameId,
        },
      },
      { upsert: true, new: true },
    ).populate("game", "title slug coverImageUrl genres releaseDate rating");

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000)
      return res.status(200).json({ message: "Already in games to review" });
    next(err);
  }
}

export async function removeFromGamesToReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { gameId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }
    const entry = await GamesToReview.findOneAndDelete({
      user: userId,
      game: gameId,
    });
    if (!entry)
      return res.status(404).json({ message: "Game not found in list" });
    res.json({ message: "Deleted", id: entry._id, game: gameId });
  } catch (err) {
    next(err);
  }
}

export async function listMyGamesToReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const entries = await GamesToReview.find({ user: userId })
      .sort({ playedAt: -1 })
      .populate("game", "title slug coverImageUrl genres releaseDate rating");
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

export async function moveFromWatchlistToReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { gameId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }

    // Check if game exists in watchlist
    const watchlistEntry = await Watchlist.findOne({
      user: userId,
      game: gameId,
    });
    if (!watchlistEntry) {
      return res
        .status(404)
        .json({ message: "Game not found in watchlist" });
    }

    // Add to games to review (upsert to handle if already exists)
    const reviewEntry = await GamesToReview.findOneAndUpdate(
      { user: userId, game: gameId },
      {
        $setOnInsert: {
          user: userId,
          game: gameId,
        },
      },
      { upsert: true, new: true },
    ).populate("game", "title slug coverImageUrl genres releaseDate rating");

    // Remove from watchlist
    await Watchlist.findOneAndDelete({
      user: userId,
      game: gameId,
    });

    res.json({
      message: "Game moved from watchlist to games to review",
      entry: reviewEntry,
    });
  } catch (err) {
    if (err.code === 11000) {
      // If already in games to review, just remove from watchlist
      const userId = req.user?.sub;
      const { gameId } = req.params;
      await Watchlist.findOneAndDelete({
        user: userId,
        game: gameId,
      });
      return res.json({
        message: "Game already in review list, removed from watchlist",
      });
    }
    next(err);
  }
}
