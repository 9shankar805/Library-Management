import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    getEmailLogs
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.put("/mark-all-read", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

// Notification Preferences
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);

// Outbound Email Audit Logs
router.get("/emails/logs", getEmailLogs);

export default router;
