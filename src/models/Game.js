import mongoose from "mongoose";
import slugify from "slugify";

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true },
    genres: [{ type: String }],
    platforms: [{ type: String }],
    rating: { type: Number, min: 0, max: 10 },
    coverImageUrl: { type: String },
    releaseDate: { type: Date },
  },
  { timestamps: true }
);

// Automatically generate slug from title
gameSchema.pre("validate", function (next) {
  if ((this.isModified("title") || !this.slug) && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Game", gameSchema);
