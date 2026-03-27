import mongoose from "mongoose";
import { z } from "zod";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import GamesToReview from "../models/GamesToReview.js";

const createQuickReviewSchema = z.object({
  gameId: z.string(),
  text: z.string().trim().max(10000).optional(),
  score: z.number().min(1).max(10),
});

export async function createQuickReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const parsed = createQuickReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });
    }

    const { gameId, score, text } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }

    const quickReview = await QuickReview.create({
      user: userId,
      game: gameId,
      score,
      text,
    });

    // On a document, populate returns a Promise (no chaining). Use array or separate awaits.
    await quickReview.populate([
      { path: "game", select: "title slug coverImageUrl" },
      { path: "user", select: "displayName" },
    ]);

    // Create notifications for followers (don't block review creation if this fails)
    try {
      // Find all users who follow the review author
      const followers = await Follow.find({ following: userId })
        .select("follower")
        .lean();

      if (followers.length > 0) {
        const gameTitle = quickReview.game?.title || "a game";
        const authorName = quickReview.user?.displayName || "Someone";

        // Create notifications for each follower
        const notifications = followers.map((follow) => ({
          user: follow.follower,
          actor: userId,
          quickReview: quickReview._id,
          type: "review_created",
          message: `${authorName} wrote a review for ${gameTitle}`,
          read: false,
        }));

        // Bulk insert notifications
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notificationError) {
      // Log error but don't fail the review creation
      console.error("Failed to create notifications:", notificationError);
    }

    // Remove game from games-to-review list (don't block review creation if this fails)
    try {
      await GamesToReview.findOneAndDelete({
        user: userId,
        game: gameId,
      });
    } catch (gamesToReviewError) {
      // Log error but don't fail the review creation
      console.error(
        "Failed to remove from games-to-review:",
        gamesToReviewError,
      );
    }

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
  text: z.string().trim().max(10000).optional(),
  score: z.number().min(1).max(10).optional(),
});

export async function updateQuickReview(req, res, next) {
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
    const quickReview = await QuickReview.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: parsed.data },
      { new: true, runValidators: true },
    )
      .populate("game", "title slug coverImageUrl")
      .populate("user", "displayName");

    if (!quickReview)
      return res.status(404).json({ message: "Quick review not found" });
    res.json(quickReview);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuickReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid quick review id" });
    }

    // Only allow users to delete their own reviews
    const quickReview = await QuickReview.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "Quick review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// (Other handlers: deleteReview, listMyReviews, listGameReviews) can stay as-is.
// They’ll now include the new fields automatically in responses.
