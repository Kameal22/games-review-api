import User from "../models/User.js";
import Watchlist from "../models/Watchlist.js";
import Review from "../models/Review.js";

// GET /api/me
export async function getMyProfile(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // 1) basic user info
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2) lists (watchlist + reviews)
    const [watchlist, reviews] = await Promise.all([
      Watchlist.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("game", "title slug coverImageUrl genres releaseDate rating") // rating if your Game has it
        .lean(),
      Review.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("game", "title slug coverImageUrl genres releaseDate")
        .lean(),
    ]);

    // 3) simple insights (extend later)
    const reviewCount = reviews.length;
    const averageFinalScore =
      reviewCount > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) /
              reviewCount) *
              10
          ) / 10
        : null;

    const insights = {
      reviewCount,
      averageFinalScore, // null if no reviews yet
      // You can add more later: mostReviewedGenre, lastActivityAt, etc.
    };

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || "",
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      watchlist, // array of { _id, user, game: {...}, status, addedAt, ... }
      reviews, // array of { _id, user, game: {...}, gameplay, story, ..., finalScore, text, ... }
      insights,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/profile/:userId
export async function getUserProfile(req, res, next) {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    // 1) basic user info
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2) lists (watchlist + reviews)
    const [watchlist, reviews] = await Promise.all([
      Watchlist.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("game", "title slug coverImageUrl genres releaseDate rating") // rating if your Game has it
        .lean(),
      Review.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("game", "title slug coverImageUrl genres releaseDate")
        .lean(),
    ]);

    // 3) simple insights (extend later)
    const reviewCount = reviews.length;
    const averageFinalScore =
      reviewCount > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) /
              reviewCount) *
              10
          ) / 10
        : null;

    const insights = {
      reviewCount,
      averageFinalScore, // null if no reviews yet
      // You can add more later: mostReviewedGenre, lastActivityAt, etc.
    };

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || "",
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      watchlist, // array of { _id, user, game: {...}, status, addedAt, ... }
      reviews, // array of { _id, user, game: {...}, gameplay, story, ..., finalScore, text, ... }
      insights,
    });
  } catch (err) {
    next(err);
  }
}
