import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// GET /api/notifications - Get user's notifications
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Pagination
    const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 50);
    const skip = parseInt(req.query.skip ?? "0", 10);

    // Optional filters
    const readFilter = req.query.read;
    let query = { user: userId };

    if (readFilter === "true") {
      query.read = true;
    } else if (readFilter === "false") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ read: 1, createdAt: -1 }) // Unread first, then by newest
      .skip(skip)
      .limit(limit)
      .populate("actor", "displayName email")
      .populate("review", "finalScore text")
      .populate({
        path: "review",
        populate: {
          path: "game",
          select: "title slug coverImageUrl",
        },
      })
      .lean();

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    res.json({
      notifications,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read - Mark a notification as read
export async function markAsRead(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { read: true } },
      { new: true }
    )
      .populate("actor", "displayName email")
      .populate("review", "finalScore text")
      .populate({
        path: "review",
        populate: {
          path: "game",
          select: "title slug coverImageUrl",
        },
      });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications/unread-count - Get count of unread notifications
export async function getUnreadCount(req, res, next) {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    res.json({ unreadCount });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notifications/:id - Delete a notification
export async function deleteNotification(req, res, next) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
}
