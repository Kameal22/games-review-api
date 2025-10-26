import mongoose from "mongoose";

const scoreField = { type: Number, min: 0, max: 10 }; // helper

const reviewSchema = new mongoose.Schema(
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

    // Detailed subscores
    gameplay: scoreField,
    story: scoreField,
    soundtrack: scoreField,
    graphics: scoreField,

    // Overall
    finalScore: { type: Number, min: 0, max: 10, required: false },

    // Optional text
    text: { type: String, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

// A user can only write ONE review per game
reviewSchema.index({ user: 1, game: 1 }, { unique: true });

// Back-compat alias: expose `rating` as virtual mapped to finalScore
reviewSchema.virtual("rating").get(function () {
  return this.finalScore ?? null;
});

// Auto-calc finalScore from provided subscores if not explicitly sent
reviewSchema.pre("validate", function (next) {
  if (this.finalScore == null) {
    const parts = [
      this.gameplay,
      this.story,
      this.soundtrack,
      this.graphics,
      this.optimization,
      this.worldDesign,
    ].filter((v) => typeof v === "number");

    if (parts.length > 0) {
      const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
      this.finalScore = Math.round(avg * 10) / 10; // one decimal
    }
  }
  next();
});

export default mongoose.model("Review", reviewSchema);
