import mongoose from "mongoose";

const gamesToReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One entry per (user, game) - a user can only have one entry per game
gamesToReviewSchema.index({ user: 1, game: 1 }, { unique: true });

export default mongoose.model("GamesToReview", gamesToReviewSchema);
