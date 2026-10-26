import prisma from "../config/db.js";
import { logAuditEvent } from "../services/auditService.js";

/**
 * @desc Get all inventory audit sessions
 * @route GET /api/inventory-audit/sessions
 */
export const getAuditSessions = async (req, res) => {
    try {
        const sessions = await prisma.inventoryAuditSession.findMany({
            orderBy: { createdAt: "desc" }
        });
        return res.json({ success: true, count: sessions.length, sessions });
    } catch (err) {
        console.error("Error in getAuditSessions:", err);
        return res.status(500).json({ success: false, message: "Could not retrieve audit sessions." });
    }
};

/**
 * @desc Start a new inventory stock audit session
 * @route POST /api/inventory-audit/sessions
 */
export const createAuditSession = async (req, res) => {
    try {
        const { sessionName, conductedBy = "Librarian", floor } = req.body;
        if (!sessionName) {
            return res.status(400).json({ success: false, message: "Session name is required." });
        }

        // Count expected physical copies
        const copyWhere = {};
        if (floor && floor !== "all") {
            copyWhere.shelf = { floor: Number(floor) };
        }
        const totalExpected = await prisma.bookCopy.count({ where: copyWhere });

        const session = await prisma.inventoryAuditSession.create({
            data: {
                sessionName,
                conductedBy,
                status: "IN_PROGRESS",
                totalExpected,
                totalScanned: 0,
                totalMissing: 0,
                totalMisplaced: 0
            }
        });

        await logAuditEvent({
            action: "AUDIT_SESSION_STARTED",
            entityType: "INVENTORY_AUDIT",
            entityId: session.id,
            performedBy: conductedBy,
            details: `Started audit session "${sessionName}" with ${totalExpected} expected copies.`
        });

        return res.status(201).json({ success: true, session });
    } catch (err) {
        console.error("Error in createAuditSession:", err);
        return res.status(500).json({ success: false, message: "Could not create audit session." });
    }
};

/**
 * @desc Get single audit session with discrepancy summary
 * @route GET /api/inventory-audit/sessions/:id
 */
export const getAuditSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma.inventoryAuditSession.findUnique({
            where: { id: Number(id) }
        });
        if (!session) {
            return res.status(404).json({ success: false, message: "Audit session not found." });
        }

        // Get recent missing or damaged copies
        const flaggedCopies = await prisma.bookCopy.findMany({
            where: {
                status: { in: ["LOST", "DAMAGED", "MAINTENANCE"] }
            },
            include: { book: true, shelf: true },
            take: 20
        });

        return res.json({ success: true, session, flaggedCopies });
    } catch (err) {
        console.error("Error in getAuditSessionById:", err);
        return res.status(500).json({ success: false, message: "Could not retrieve audit session." });
    }
};

/**
 * @desc Scan a book copy barcode, RFID, or accession number into active audit session
 * @route POST /api/inventory-audit/sessions/:id/scan
 */
export const scanAuditCopy = async (req, res) => {
    try {
        const { id } = req.params;
        const { scanValue } = req.body; // Can be barcode, rfidTag, or accessionNo

        if (!scanValue) {
            return res.status(400).json({ success: false, message: "Scan value (barcode, RFID tag, or accession number) is required." });
        }

        const session = await prisma.inventoryAuditSession.findUnique({
            where: { id: Number(id) }
        });
        if (!session) {
            return res.status(404).json({ success: false, message: "Audit session not found." });
        }

        // Find the copy in the database
        const cleanScan = String(scanValue).trim();
        const copy = await prisma.bookCopy.findFirst({
            where: {
                OR: [
                    { barcode: cleanScan },
                    { rfidTag: cleanScan },
                    { accessionNo: cleanScan }
                ]
            },
            include: { book: true, shelf: true }
        });

        if (!copy) {
            return res.status(404).json({
                success: false,
                message: `Unrecognized copy "${cleanScan}". No matching accession number or RFID tag in database.`
            });
        }

        // Check if misplaced (e.g. status was MISSING or on wrong shelf)
        const isMisplaced = copy.status === "LOST" || copy.condition === "POOR";

        // Increment session scan count
        const updatedSession = await prisma.inventoryAuditSession.update({
            where: { id: Number(id) },
            data: {
                totalScanned: { increment: 1 },
                ...(isMisplaced ? { totalMisplaced: { increment: 1 } } : {})
            }
        });

        return res.json({
            success: true,
            copy: {
                id: copy.id,
                accessionNo: copy.accessionNo,
                barcode: copy.barcode,
                rfidTag: copy.rfidTag,
                condition: copy.condition,
                status: copy.status,
                bookTitle: copy.book?.title,
                shelfLocation: copy.shelf ? `Floor ${copy.shelf.floor} · ${copy.shelf.section} (${copy.shelf.rackNumber})` : "General Stack"
            },
            isMisplaced,
            sessionStats: {
                totalExpected: updatedSession.totalExpected,
                totalScanned: updatedSession.totalScanned,
                totalMisplaced: updatedSession.totalMisplaced
            }
        });
    } catch (err) {
        console.error("Error in scanAuditCopy:", err);
        return res.status(500).json({ success: false, message: "Could not register scan." });
    }
};

/**
 * @desc Finalize audit session and reconcile physical inventory
 * @route POST /api/inventory-audit/sessions/:id/reconcile
 */
export const reconcileAuditSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma.inventoryAuditSession.findUnique({
            where: { id: Number(id) }
        });
        if (!session) {
            return res.status(404).json({ success: false, message: "Audit session not found." });
        }

        const totalMissing = Math.max(0, session.totalExpected - session.totalScanned);

        const updated = await prisma.inventoryAuditSession.update({
            where: { id: Number(id) },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                totalMissing
            }
        });

        await logAuditEvent({
            action: "AUDIT_SESSION_RECONCILED",
            entityType: "INVENTORY_AUDIT",
            entityId: session.id,
            performedBy: session.conductedBy,
            details: `Completed session "${session.sessionName}". Scanned: ${session.totalScanned}, Missing: ${totalMissing}, Misplaced: ${session.totalMisplaced}.`
        });

        return res.json({
            success: true,
            message: `Audit session reconciled successfully. ${session.totalScanned} copies accounted for.`,
            session: updated
        });
    } catch (err) {
        console.error("Error in reconcileAuditSession:", err);
        return res.status(500).json({ success: false, message: "Could not reconcile audit session." });
    }
};

/**
 * @desc Mark a physical copy as LOST
 * @route POST /api/inventory-audit/copies/:id/mark-lost
 */
export const markCopyLost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = "Unaccounted during stock verification", performedBy = "Librarian" } = req.body;

        const copy = await prisma.bookCopy.findUnique({
            where: { id: Number(id) },
            include: { book: true }
        });
        if (!copy) {
            return res.status(404).json({ success: false, message: "Book copy not found." });
        }

        const updated = await prisma.bookCopy.update({
            where: { id: Number(id) },
            data: { status: "LOST" }
        });

        // Decrement available copies if it was available
        if (copy.status === "AVAILABLE") {
            await prisma.bookAvailability.updateMany({
                where: { bookId: copy.bookId },
                data: {
                    availableCopies: { decrement: 1 },
                    totalCopies: { decrement: 1 }
                }
            });
        }

        await logAuditEvent({
            action: "BOOK_COPY_MARKED_LOST",
            entityType: "BOOK_COPY",
            entityId: copy.id,
            performedBy,
            details: `Copy ${copy.accessionNo} (${copy.book?.title}) marked as LOST. Reason: ${reason}`
        });

        return res.json({ success: true, message: `Copy ${copy.accessionNo} marked as LOST.`, copy: updated });
    } catch (err) {
        console.error("Error in markCopyLost:", err);
        return res.status(500).json({ success: false, message: "Could not mark copy as lost." });
    }
};

/**
 * @desc Write off damaged copy from circulation
 * @route POST /api/inventory-audit/copies/:id/write-off
 */
export const writeOffCopy = async (req, res) => {
    try {
        const { id } = req.params;
        const { writeOffReason = "Severe physical damage", status = "DAMAGED", performedBy = "Librarian" } = req.body;

        const copy = await prisma.bookCopy.findUnique({
            where: { id: Number(id) },
            include: { book: true }
        });
        if (!copy) {
            return res.status(404).json({ success: false, message: "Book copy not found." });
        }

        const updated = await prisma.bookCopy.update({
            where: { id: Number(id) },
            data: {
                status: status || "DAMAGED",
                condition: "POOR"
            }
        });

        // Adjust book inventory totals
        if (copy.status === "AVAILABLE") {
            await prisma.bookAvailability.updateMany({
                where: { bookId: copy.bookId },
                data: {
                    availableCopies: { decrement: 1 },
                    totalCopies: { decrement: 1 }
                }
            });
        }

        await logAuditEvent({
            action: "BOOK_COPY_WRITTEN_OFF",
            entityType: "BOOK_COPY",
            entityId: copy.id,
            performedBy,
            details: `Copy ${copy.accessionNo} (${copy.book?.title}) written off. Reason: ${writeOffReason}`
        });

        return res.json({
            success: true,
            message: `Copy ${copy.accessionNo} written off as ${status}.`,
            copy: updated
        });
    } catch (err) {
        console.error("Error in writeOffCopy:", err);
        return res.status(500).json({ success: false, message: "Could not write off copy." });
    }
};
