import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

// Specific routes must come before parameterized routes
router.get("/unread-count", requireAuth, getUnreadCount); // GET /api/notifications/unread-count
router.patch("/read-all", requireAuth, markAllAsRead); // PATCH /api/notifications/read-all
router.patch("/:id/read", requireAuth, markAsRead); // PATCH /api/notifications/:id/read
router.delete("/:id", requireAuth, deleteNotification); // DELETE /api/notifications/:id
router.get("/", requireAuth, getNotifications); // GET /api/notifications (must be last to avoid conflicts)

export default router;
