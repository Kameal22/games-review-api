import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["planned", "watching", "completed"],
      default: "planned",
    },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One watchlist entry per (user, game)
watchlistSchema.index({ user: 1, game: 1 }, { unique: true });

export default mongoose.model("Watchlist", watchlistSchema);
