import prisma from "../config/db.js";
import {
    sendDueReminderEmail,
    sendOverdueAlertEmail,
    sendReservationReadyEmail,
    sendIssueReceiptEmail,
    sendReturnReceiptEmail,
    getOutboundEmailLogs
} from "../services/emailService.js";

/**
 * Dispatch an in-app notification and optionally trigger email based on preferences
 */
export async function dispatchNotification({
    userId,
    userEmail,
    userName,
    rollNo,
    type,
    title,
    message,
    link,
    metadata = {}
}) {
    try {
        // 1. Fetch user preferences
        let pref = await prisma.userPreference.findUnique({
            where: { userId: String(userId) }
        });

        if (!pref) {
            pref = await prisma.userPreference.create({
                data: {
                    userId: String(userId),
                    emailReminders: true,
                    inAppAlerts: true,
                    overdueAlerts: true,
                    reservationAlerts: true
                }
            });
        }

        // 2. Create in-app notification if allowed
        let notification = null;
        if (pref.inAppAlerts) {
            notification = await prisma.notification.create({
                data: {
                    userId: String(userId),
                    type,
                    title,
                    message,
                    link: link || null
                }
            });
        }

        // 3. Dispatch automated email if allowed
        const emailAllowed = pref.emailReminders && (
            (type === "DUE_REMINDER") ||
            (type === "OVERDUE_ALERT" && pref.overdueAlerts) ||
            (type === "RESERVATION_READY" && pref.reservationAlerts) ||
            (type === "RECEIPT")
        );

        if (emailAllowed && userEmail) {
            if (type === "DUE_REMINDER") {
                await sendDueReminderEmail({
                    studentEmail: userEmail,
                    studentName: userName || "Student",
                    rollNo: rollNo || userId,
                    bookTitle: metadata.bookTitle,
                    author: metadata.author,
                    dueDate: metadata.dueDate,
                    daysLeft: metadata.daysLeft || 3
                });
            } else if (type === "OVERDUE_ALERT") {
                await sendOverdueAlertEmail({
                    studentEmail: userEmail,
                    studentName: userName || "Student",
                    rollNo: rollNo || userId,
                    bookTitle: metadata.bookTitle,
                    author: metadata.author,
                    dueDate: metadata.dueDate,
                    daysOverdue: metadata.daysOverdue || 1,
                    fineAmount: metadata.fineAmount || 0
                });
            } else if (type === "RESERVATION_READY") {
                await sendReservationReadyEmail({
                    studentEmail: userEmail,
                    studentName: userName || "Student",
                    rollNo: rollNo || userId,
                    bookTitle: metadata.bookTitle,
                    token: metadata.token,
                    pickupDeadline: metadata.pickupDeadline,
                    shelfLocation: metadata.shelfLocation
                });
            } else if (type === "RECEIPT" && metadata.receiptType === "ISSUE") {
                await sendIssueReceiptEmail({
                    studentEmail: userEmail,
                    studentName: userName || "Student",
                    rollNo: rollNo || userId,
                    bookTitle: metadata.bookTitle,
                    accessionNo: metadata.accessionNo,
                    barcode: metadata.barcode,
                    issueDate: metadata.issueDate,
                    dueDate: metadata.dueDate,
                    txnId: metadata.txnId
                });
            } else if (type === "RECEIPT" && metadata.receiptType === "RETURN") {
                await sendReturnReceiptEmail({
                    studentEmail: userEmail,
                    studentName: userName || "Student",
                    rollNo: rollNo || userId,
                    bookTitle: metadata.bookTitle,
                    returnDate: metadata.returnDate,
                    fineAmount: metadata.fineAmount
                });
            }
        }

        return notification;
    } catch (err) {
        console.error("Error dispatching notification:", err);
        return null;
    }
}

/**
 * @desc Get user notifications and unread count
 * @route GET /api/notifications
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.rollNo || req.query.userId || "all";
        const limit = parseInt(req.query.limit, 10) || 30;

        const whereClause = {};
        if (userId !== "all") {
            whereClause.userId = String(userId);
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                take: limit
            }),
            prisma.notification.count({
                where: { ...whereClause, isRead: false }
            })
        ]);

        return res.json({
            success: true,
            unreadCount,
            total: notifications.length,
            notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ success: false, message: "Could not fetch notifications." });
    }
};

/**
 * @desc Mark a notification as read
 * @route PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return res.json({ success: true, notification: updated });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ success: false, message: "Could not update notification." });
    }
};

/**
 * @desc Mark all notifications as read for current user
 * @route PUT /api/notifications/mark-all-read
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.rollNo || req.body.userId;
        const whereClause = userId ? { userId: String(userId), isRead: false } : { isRead: false };

        const updated = await prisma.notification.updateMany({
            where: whereClause,
            data: { isRead: true }
        });

        return res.json({ success: true, updatedCount: updated.count });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({ success: false, message: "Could not mark all as read." });
    }
};

/**
 * @desc Delete a notification
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.notification.delete({ where: { id } });
        return res.json({ success: true, message: "Notification deleted." });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({ success: false, message: "Could not delete notification." });
    }
};

/**
 * @desc Get user notification preferences
 * @route GET /api/notifications/preferences
 */
export const getPreferences = async (req, res) => {
    try {
        const userId = String(req.user?.id || req.user?.rollNo || req.query.userId || "default");
        let pref = await prisma.userPreference.findUnique({ where: { userId } });
        if (!pref) {
            pref = await prisma.userPreference.create({
                data: {
                    userId,
                    emailReminders: true,
                    inAppAlerts: true,
                    overdueAlerts: true,
                    reservationAlerts: true
                }
            });
        }

        return res.json({ success: true, preferences: pref });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return res.status(500).json({ success: false, message: "Could not fetch preferences." });
    }
};

/**
 * @desc Update user notification preferences
 * @route PUT /api/notifications/preferences
 */
export const updatePreferences = async (req, res) => {
    try {
        const userId = String(req.user?.id || req.user?.rollNo || req.body.userId || "default");
        const { emailReminders, inAppAlerts, overdueAlerts, reservationAlerts } = req.body;

        const updated = await prisma.userPreference.upsert({
            where: { userId },
            create: {
                userId,
                emailReminders: emailReminders ?? true,
                inAppAlerts: inAppAlerts ?? true,
                overdueAlerts: overdueAlerts ?? true,
                reservationAlerts: reservationAlerts ?? true
            },
            update: {
                ...(emailReminders !== undefined && { emailReminders }),
                ...(inAppAlerts !== undefined && { inAppAlerts }),
                ...(overdueAlerts !== undefined && { overdueAlerts }),
                ...(reservationAlerts !== undefined && { reservationAlerts })
            }
        });

        return res.json({ success: true, preferences: updated });
    } catch (error) {
        console.error("Error updating preferences:", error);
        return res.status(500).json({ success: false, message: "Could not update preferences." });
    }
};

/**
 * @desc View outbound email audit logs
 * @route GET /api/notifications/emails/logs
 */
export const getEmailLogs = (req, res) => {
    const logs = getOutboundEmailLogs(req.query.limit ? parseInt(req.query.limit, 10) : 50);
    return res.json({ success: true, total: logs.length, logs });
};
