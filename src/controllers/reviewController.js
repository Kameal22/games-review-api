import mongoose from "mongoose";
import { z } from "zod";
import Review from "../models/Review.js";
import Game from "../models/Game.js";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import ReviewInteraction from "../models/ReviewInteraction.js";
import GamesToReview from "../models/GamesToReview.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Reusable score validator (0–10)
const score = z.number().min(0).max(10);

const createSchema = z.object({
  gameId: z.string(),
  text: z.string().trim().max(10000).optional(),

  // allow subscores +/or finalScore
  gameplay: score.optional(),
  story: score.optional(),
  soundtrack: score.optional(),
  graphics: score.optional(),
  optimization: score.optional(),
  worldDesign: score.optional(),
  finalScore: score.optional(),
});

const createQuickSchema = z.object({
  gameId: z.string(),
  text: z.string().trim().max(10000).optional(),
  finalScore: z.number().min(1).max(10),
});

export async function getReviews(req, res, next) {
  try {
    const userId = req.user?.sub;

    // Pagination: ?page=1&limit=10
    const limit = Math.min(
      Math.max(parseInt(req.query.limit ?? "20", 10) || 20, 1),
      50
    );
    const page = Math.max(parseInt(req.query.page ?? "1", 10) || 1, 1);
    const skip = (page - 1) * limit;

    // Search: ?q=elden (matches game title only)
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    let filter = {};
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      const matchingGames = await Game.find({ title: regex }).select("_id").lean();
      filter = { game: { $in: matchingGames.map((g) => g._id) } };
    }

    const [reviews, totalCount] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "displayName") // only return displayName
        .populate("game", "title slug coverImageUrl genres releaseDate") // select game fields you need
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Get like/dislike counts and user's interaction for each review
    const reviewIds = reviews.map((r) => r._id);
    const [likeCounts, dislikeCounts, userInteractions] = await Promise.all([
      ReviewInteraction.aggregate([
        { $match: { review: { $in: reviewIds }, type: "like" } },
        { $group: { _id: "$review", count: { $sum: 1 } } },
      ]),
      ReviewInteraction.aggregate([
        { $match: { review: { $in: reviewIds }, type: "dislike" } },
        { $group: { _id: "$review", count: { $sum: 1 } } },
      ]),
      userId
        ? ReviewInteraction.find({
            user: userId,
            review: { $in: reviewIds },
          }).lean()
        : Promise.resolve([]),
    ]);

    // Create maps for quick lookup
    const likeMap = new Map(
      likeCounts.map((item) => [item._id.toString(), item.count])
    );
    const dislikeMap = new Map(
      dislikeCounts.map((item) => [item._id.toString(), item.count])
    );
    const interactionMap = new Map(
      userInteractions.map((item) => [item.review.toString(), item.type])
    );

    // Add counts and user interaction to each review
    const reviewsWithCounts = reviews.map((review) => ({
      ...review,
      likes: likeMap.get(review._id.toString()) || 0,
      dislikes: dislikeMap.get(review._id.toString()) || 0,
      userInteraction: interactionMap.get(review._id.toString()) || null,
    }));

    res.json({
      reviews: reviewsWithCounts,
      pagination: {
        total: totalCount,
        page,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSingleReview(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    const review = await Review.findById(id)
      .populate("user", "displayName")
      .populate("game", "title slug coverImageUrl genres releaseDate")
      .lean();

    if (!review) return res.status(404).json({ message: "Review not found" });

    // Get like/dislike counts
    const [likes, dislikes, userInteraction] = await Promise.all([
      ReviewInteraction.countDocuments({ review: id, type: "like" }),
      ReviewInteraction.countDocuments({ review: id, type: "dislike" }),
      userId
        ? ReviewInteraction.findOne({ user: userId, review: id }).lean()
        : Promise.resolve(null),
    ]);

    res.json({
      ...review,
      likes,
      dislikes,
      userInteraction: userInteraction?.type || null,
    });
  } catch (err) {
    next(err);
  }
}

export async function listUserReviews(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // optional pagination: ?limit=10&skip=0
    const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 50);
    const skip = parseInt(req.query.skip ?? "0", 10);

    const reviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "displayName")
      .populate("game", "title slug coverImageUrl genres releaseDate")
      .lean();

    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function listMyReviews(req, res, next) {
  try {
    const userId = req.user?.sub;
    const reviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("game", "title slug coverImageUrl genres releaseDate rating");
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

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

    // Create notifications for followers (don't block review creation if this fails)
    try {
      // Find all users who follow the review author
      const followers = await Follow.find({ following: userId })
        .select("follower")
        .lean();

      if (followers.length > 0) {
        const gameTitle = review.game?.title || "a game";
        const authorName = review.user?.displayName || "Someone";

        // Create notifications for each follower
        const notifications = followers.map((follow) => ({
          user: follow.follower,
          actor: userId,
          review: review._id,
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
      console.error("Failed to remove from games-to-review:", gamesToReviewError);
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

export async function createQuickReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const parsed = createQuickSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", issues: parsed.error.issues });
    }

    const { gameId, finalScore, text } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }

    const review = await Review.create({
      user: userId,
      game: gameId,
      finalScore,
      text,
    });

    await review.populate([
      { path: "game", select: "title slug coverImageUrl" },
      { path: "user", select: "displayName" },
    ]);

    // Create notifications for followers (don't block review creation if this fails)
    try {
      const followers = await Follow.find({ following: userId })
        .select("follower")
        .lean();

      if (followers.length > 0) {
        const gameTitle = review.game?.title || "a game";
        const authorName = review.user?.displayName || "Someone";

        const notifications = followers.map((follow) => ({
          user: follow.follower,
          actor: userId,
          review: review._id,
          type: "review_created",
          message: `${authorName} wrote a review for ${gameTitle}`,
          read: false,
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notificationError) {
      console.error("Failed to create notifications:", notificationError);
    }

    // Remove game from games-to-review list (don't block review creation if this fails)
    try {
      await GamesToReview.findOneAndDelete({
        user: userId,
        game: gameId,
      });
    } catch (gamesToReviewError) {
      console.error("Failed to remove from games-to-review:", gamesToReviewError);
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

export async function checkReviewExists(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { gameId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }
    const review = await Review.findOne({ user: userId, game: gameId });
    if (review) {
      return res
        .status(200)
        .json({ message: "You already reviewed this game" });
    }
    return res.status(404).json({ message: "Review not found" });
  } catch (err) {
    next(err);
  }
}

const updateSchema = z.object({
  text: z.string().trim().max(10000).optional(),
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

export async function deleteReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    // Only allow users to delete their own reviews
    const review = await Review.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function fetchAndSortTenByHighestScore(req, res, next) {
  try {
    const { category } = req.query;

    // Define valid categories and their corresponding fields
    const validCategories = {
      gameplay: "gameplay",
      story: "story",
      soundtrack: "soundtrack",
      graphics: "graphics",
      finalScore: "finalScore",
    };

    // Determine which field to sort by
    let sortField = "finalScore"; // default
    let queryFilter = { finalScore: { $exists: true, $ne: null } };

    if (category && validCategories[category]) {
      sortField = validCategories[category];
      queryFilter = { [sortField]: { $exists: true, $ne: null } };
    }

    const reviews = await Review.find(queryFilter)
      .sort({ [sortField]: -1 })
      .limit(10)
      .populate("game", "title slug coverImageUrl genres releaseDate")
      .populate("user", "displayName");

    if (!reviews || reviews.length === 0)
      return res.status(404).json({ message: "No reviews found" });

    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

// (Other handlers: deleteReview, listMyReviews, listGameReviews) can stay as-is.
// They’ll now include the new fields automatically in responses.
