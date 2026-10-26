import prisma from "../config/db.js";

/**
 * Log an immutable administrative or system event into audit_logs table
 */
export const logAuditEvent = async ({
    action,
    entityType,
    entityId = null,
    performedBy = "SYSTEM",
    details = "",
    ipAddress = null
}) => {
    try {
        return await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId: entityId ? String(entityId) : null,
                performedBy: String(performedBy),
                details: typeof details === "object" ? JSON.stringify(details) : String(details),
                ipAddress: ipAddress ? String(ipAddress) : null
            }
        });
    } catch (err) {
        console.error("Failed to write audit log:", err.message);
        return null;
    }
};

/**
 * Query audit logs with multi-field filters & pagination
 */
export const queryAuditLogs = async ({
    action,
    entityType,
    performedBy,
    limit = 50,
    page = 1
} = {}) => {
    const where = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entityType) where.entityType = { equals: entityType, mode: "insensitive" };
    if (performedBy) where.performedBy = { contains: performedBy, mode: "insensitive" };

    const take = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take,
            skip
        })
    ]);

    return { total, page, totalPages: Math.ceil(total / take), logs };
};
