import mongoose from "mongoose";
import { z } from "zod";
import Review from "../models/Review.js";

// Reusable score validator (0–10)
const score = z.number().min(0).max(10);

const createSchema = z.object({
  gameId: z.string(),
  text: z.string().trim().max(5000).optional(),

  // allow subscores +/or finalScore
  gameplay: score.optional(),
  story: score.optional(),
  soundtrack: score.optional(),
  graphics: score.optional(),
  optimization: score.optional(),
  worldDesign: score.optional(),
  finalScore: score.optional(),
});

export async function createReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });
    }

    const { gameId, finalScore, ...rest } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }

    // Ensure at least one scoring input (finalScore or any subscore)
    const hasAnySub = [
      "gameplay",
      "story",
      "soundtrack",
      "graphics",
      "optimization",
      "worldDesign",
    ].some((k) => typeof rest[k] === "number");
    if (finalScore == null && !hasAnySub) {
      return res
        .status(400)
        .json({ message: "Provide finalScore or at least one subscore" });
    }

    const review = await Review.create({
      user: userId,
      game: gameId,
      finalScore,
      ...rest,
    });

    // On a document, populate returns a Promise (no chaining). Use array or separate awaits.
    await review.populate([
      { path: "game", select: "title slug coverImageUrl" },
      { path: "user", select: "displayName" },
    ]);

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "You already reviewed this game" });
    }
    next(err);
  }
}

const updateSchema = z.object({
  text: z.string().trim().max(5000).optional(),
  gameplay: score.optional(),
  story: score.optional(),
  soundtrack: score.optional(),
  graphics: score.optional(),
  optimization: score.optional(),
  worldDesign: score.optional(),
  finalScore: score.optional(),
});

export async function updateReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });
    }

    // Query-level chaining populate is fine
    const review = await Review.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    )
      .populate("game", "title slug coverImageUrl")
      .populate("user", "displayName");

    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json(review);
  } catch (err) {
    next(err);
  }
}

// (Other handlers: deleteReview, listMyReviews, listGameReviews) can stay as-is.
// They’ll now include the new fields automatically in responses.
