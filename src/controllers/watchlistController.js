import mongoose from "mongoose";
import { z } from "zod";
import Watchlist from "../models/Watchlist.js";

const addSchema = z.object({
  gameId: z.string(),
  status: z.enum(["planned", "watching", "completed"]).optional(),
});

export async function addToWatchlist(req, res, next) {
  try {
    const userId = req.user?.sub;
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });

    const { gameId, status } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(gameId))
      return res.status(400).json({ message: "Invalid gameId" });

    const entry = await Watchlist.findOneAndUpdate(
      { user: userId, game: gameId },
      {
        $setOnInsert: {
          user: userId,
          game: gameId,
          status: status || "planned",
        },
      },
      { upsert: true, new: true }
    ).populate("game", "title slug coverImageUrl genres releaseDate rating");

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000)
      return res.status(200).json({ message: "Already on watchlist" });
    next(err);
  }
}

const updateSchema = z.object({
  status: z.enum(["planned", "watching", "completed"]),
});

export async function updateWatchlistStatus(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params; // watchlist entry id
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });

    const entry = await Watchlist.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).populate("game", "title slug coverImageUrl");

    if (!entry)
      return res.status(404).json({ message: "Watchlist entry not found" });
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

export async function removeFromWatchlistByGame(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { gameId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }
    const entry = await Watchlist.findOneAndDelete({
      user: userId,
      game: gameId,
    });
    if (!entry)
      return res.status(404).json({ message: "Watchlist entry not found" });
    res.json({ message: "Deleted", id: entry._id, game: gameId });
  } catch (err) {
    next(err);
  }
}

export async function listMyWatchlist(req, res, next) {
  try {
    const userId = req.user?.sub;
    const entries = await Watchlist.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("game", "title slug coverImageUrl genres releaseDate rating");
    res.json(entries);
  } catch (err) {
    next(err);
  }
}
