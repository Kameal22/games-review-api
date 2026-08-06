import Game from "../models/Game.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getGames(req, res, next) {
  try {
    // Search: ?q=elden (matches game title)
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const filter = q
      ? { title: { $regex: escapeRegex(q), $options: "i" } }
      : {};

    // Pagination: ?page=1&limit=20
    const limit = Math.min(
      Math.max(parseInt(req.query.limit ?? "20", 10) || 20, 1),
      50,
    );
    const page = Math.max(parseInt(req.query.page ?? "1", 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [games, totalCount] = await Promise.all([
      Game.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Game.countDocuments(filter),
    ]);

    res.json({
      games,
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
