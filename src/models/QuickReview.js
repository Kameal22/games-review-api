import mongoose from "mongoose";

const quickReviewSchema = new mongoose.Schema(
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

    // 1–10 only (quick rating)
    finalScore: { type: Number, min: 1, max: 10, required: true },

    // Optional quick note
    text: { type: String, trim: true, maxlength: 10000 },
  },
  { timestamps: true },
);

// A user can only write ONE quick review per game
quickReviewSchema.index({ user: 1, game: 1 }, { unique: true });

export default mongoose.model("QuickReview", quickReviewSchema);
