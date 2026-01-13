import mongoose from "mongoose";
import ReviewInteraction from "../models/ReviewInteraction.js";
import Review from "../models/Review.js";

// POST /api/reviews/:reviewId/like - Like a review
export async function likeReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Prevent users from liking their own reviews
    if (review.user.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot like your own review" });
    }

    // Check if user already has an interaction
    const existingInteraction = await ReviewInteraction.findOne({
      user: userId,
      review: reviewId,
    });

    if (existingInteraction) {
      if (existingInteraction.type === "like") {
        return res.status(409).json({ message: "Already liked this review" });
      } else {
        // User previously disliked, change to like
        existingInteraction.type = "like";
        await existingInteraction.save();
        return res.json({
          message: "Changed dislike to like",
          interaction: existingInteraction,
        });
      }
    }

    // Create new like
    const interaction = await ReviewInteraction.create({
      user: userId,
      review: reviewId,
      type: "like",
    });

    res.status(201).json({
      message: "Review liked successfully",
      interaction,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Already interacted with this review" });
    }
    next(err);
  }
}

// POST /api/reviews/:reviewId/dislike - Dislike a review
export async function dislikeReview(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    // Check if review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Prevent users from disliking their own reviews
    if (review.user.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot dislike your own review" });
    }

    // Check if user already has an interaction
    const existingInteraction = await ReviewInteraction.findOne({
      user: userId,
      review: reviewId,
    });

    if (existingInteraction) {
      if (existingInteraction.type === "dislike") {
        return res
          .status(409)
          .json({ message: "Already disliked this review" });
      } else {
        // User previously liked, change to dislike
        existingInteraction.type = "dislike";
        await existingInteraction.save();
        return res.json({
          message: "Changed like to dislike",
          interaction: existingInteraction,
        });
      }
    }

    // Create new dislike
    const interaction = await ReviewInteraction.create({
      user: userId,
      review: reviewId,
      type: "dislike",
    });

    res.status(201).json({
      message: "Review disliked successfully",
      interaction,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Already interacted with this review" });
    }
    next(err);
  }
}

// DELETE /api/reviews/:reviewId/interaction - Remove like/dislike
export async function removeInteraction(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const interaction = await ReviewInteraction.findOneAndDelete({
      user: userId,
      review: reviewId,
    });

    if (!interaction) {
      return res.status(404).json({ message: "No interaction found" });
    }

    res.json({ message: "Interaction removed successfully" });
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/:reviewId/interaction - Get user's interaction status
export async function getMyInteraction(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { reviewId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const interaction = await ReviewInteraction.findOne({
      user: userId,
      review: reviewId,
    }).lean();

    res.json({
      hasInteraction: !!interaction,
      type: interaction?.type || null,
    });
  } catch (err) {
    next(err);
  }
}
