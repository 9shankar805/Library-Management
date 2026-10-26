import prisma from "../config/db.js";
import { logAuditEvent, queryAuditLogs } from "../services/auditService.js";

/**
 * @desc Get Paginated Audit Logs with Multi-filter
 * @route GET /api/audit-logs
 */
export const getAuditLogs = async (req, res) => {
    try {
        const { action, entityType, performedBy, page = 1, limit = 50 } = req.query;

        const result = await queryAuditLogs({
            action,
            entityType,
            performedBy,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

        return res.json({ success: true, ...result });
    } catch (err) {
        console.error("Error in getAuditLogs:", err);
        return res.status(500).json({ success: false, message: "Could not retrieve audit logs." });
    }
};

/**
 * @desc Record a custom Audit Log entry
 * @route POST /api/audit-logs
 */
export const recordAuditLog = async (req, res) => {
    try {
        const { action, entityType, entityId, performedBy = req.user?.email || "Librarian", details } = req.body;

        if (!action || !entityType) {
            return res.status(400).json({ success: false, message: "Action and entityType are required." });
        }

        const log = await logAuditEvent({
            action,
            entityType,
            entityId,
            performedBy,
            details,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1"
        });

        return res.status(201).json({ success: true, log });
    } catch (err) {
        console.error("Error in recordAuditLog:", err);
        return res.status(500).json({ success: false, message: "Could not record audit log." });
    }
};

/**
 * @desc Get Summary of System Actions Breakdown
 * @route GET /api/audit-logs/actions-summary
 */
export const getAuditActionsSummary = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            select: { action: true, entityType: true, timestamp: true },
            orderBy: { timestamp: "desc" },
            take: 200
        });

        const entityCounts = {};
        const actionCounts = {};

        logs.forEach((log) => {
            entityCounts[log.entityType] = (entityCounts[log.entityType] || 0) + 1;
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });

        return res.json({
            success: true,
            totalRecentLogs: logs.length,
            byEntityType: entityCounts,
            byAction: actionCounts
        });
    } catch (err) {
        console.error("Error in getAuditActionsSummary:", err);
        return res.status(500).json({ success: false, message: "Could not retrieve audit summary." });
    }
};
