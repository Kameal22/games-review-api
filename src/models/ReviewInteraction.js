import mongoose from "mongoose";

const reviewInteractionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  { timestamps: true }
);

// A user can only have ONE interaction per review (either like or dislike)
reviewInteractionSchema.index({ user: 1, review: 1 }, { unique: true });

// Index for efficient querying
reviewInteractionSchema.index({ review: 1, type: 1 });

export default mongoose.model("ReviewInteraction", reviewInteractionSchema);
