import mongoose from "mongoose";
import Follow from "../models/Follow.js";
import User from "../models/User.js";

// POST /api/follow/:userId - Follow a user
export async function followUser(req, res, next) {
  try {
    const followerId = req.user?.sub;
    const { userId } = req.params;

    if (!followerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Prevent self-follow
    if (followerId === userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create follow relationship
    const follow = await Follow.create({
      follower: followerId,
      following: userId,
    });

    await follow.populate("following", "displayName email bio");

    res.status(201).json({
      message: "Successfully followed user",
      follow,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already following this user" });
    }
    next(err);
  }
}

// DELETE /api/follow/:userId - Unfollow a user
export async function unfollowUser(req, res, next) {
  try {
    const followerId = req.user?.sub;
    const { userId } = req.params;

    if (!followerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId,
    });

    if (!follow) {
      return res.status(404).json({ message: "Not following this user" });
    }

    res.json({ message: "Successfully unfollowed user" });
  } catch (err) {
    next(err);
  }
}

// GET /api/follow/followers - Get current user's followers
export async function getFollowers(req, res, next) {
  try {
    const userId = req.user?.sub;
    const targetUserId = req.query.userId || userId; // Allow querying other users' followers if needed

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (targetUserId && !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Pagination
    const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 50);
    const skip = parseInt(req.query.skip ?? "0", 10);

    const followers = await Follow.find({ following: targetUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("follower", "displayName email bio")
      .lean();

    const totalCount = await Follow.countDocuments({ following: targetUserId });

    res.json({
      followers,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/follow/following - Get users that current user is following
export async function getFollowing(req, res, next) {
  try {
    const userId = req.user?.sub;
    const targetUserId = req.query.userId || userId; // Allow querying other users' following list

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (targetUserId && !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // Pagination
    const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 50);
    const skip = parseInt(req.query.skip ?? "0", 10);

    const following = await Follow.find({ follower: targetUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("following", "displayName email bio")
      .lean();

    const totalCount = await Follow.countDocuments({ follower: targetUserId });

    res.json({
      following,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/follow/:userId/status - Check if current user follows a specific user
export async function getFollowStatus(req, res, next) {
  try {
    const followerId = req.user?.sub;
    const { userId } = req.params;

    if (!followerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const follow = await Follow.findOne({
      follower: followerId,
      following: userId,
    }).lean();

    res.json({
      isFollowing: !!follow,
    });
  } catch (err) {
    next(err);
  }
}
