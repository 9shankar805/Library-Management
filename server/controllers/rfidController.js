import prisma from "../config/db.js";

/**
 * @desc Scan one or multiple RFID EPC tags
 * @route POST /api/rfid/scan
 */
export const scanRfid = async (req, res) => {
    try {
        const { tag, tags, epc } = { ...req.query, ...req.body };
        const singleTag = tag || epc;
        const tagList = tags && Array.isArray(tags) ? tags : (singleTag ? [singleTag] : []);

        if (tagList.length === 0) {
            return res.status(400).json({ success: false, message: "At least one RFID tag must be provided." });
        }

        const cleanTags = tagList.map(t => String(t).trim().toUpperCase());

        const copies = await prisma.bookCopy.findMany({
            where: {
                rfidTag: { in: cleanTags }
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        category: { select: { name: true } },
                        department: { select: { name: true } }
                    }
                },
                shelf: true,
                issuedBooks: {
                    where: { isReturned: false },
                    include: {
                        student: {
                            select: {
                                rollNo: true,
                                user: { select: { username: true } }
                            }
                        }
                    }
                }
            }
        });

        const foundTagsSet = new Set(copies.map(c => c.rfidTag.toUpperCase()));
        const unrecognizedTags = cleanTags.filter(t => !foundTagsSet.has(t));

        const results = copies.map(c => ({
            id: c.id,
            rfidTag: c.rfidTag,
            accessionNo: c.accessionNo,
            barcode: c.barcode,
            status: c.status,
            condition: c.condition,
            book: c.book,
            shelf: c.shelf,
            currentLoan: c.issuedBooks[0] || null
        }));

        return res.status(200).json({
            success: true,
            totalScanned: cleanTags.length,
            recognizedCount: results.length,
            unrecognizedCount: unrecognizedTags.length,
            copies: results,
            unrecognizedTags
        });
    } catch (error) {
        console.error("RFID scan error:", error);
        return res.status(500).json({ success: false, message: "RFID scan processing failed.", error: error.message });
    }
};

/**
 * @desc Perform rapid bulk RFID inventory audit on a shelf
 * @route POST /api/rfid/bulk-audit
 */
export const bulkAuditShelf = async (req, res) => {
    try {
        const { shelfId, scannedTags = [], conductedBy = "Librarian" } = req.body;

        if (!shelfId) {
            return res.status(400).json({ success: false, message: "shelfId is required." });
        }

        const parsedShelfId = parseInt(shelfId, 10);
        const targetShelf = await prisma.shelf.findUnique({
            where: { id: parsedShelfId }
        });

        if (!targetShelf) {
            return res.status(404).json({ success: false, message: "Shelf not found." });
        }

        const cleanScannedTags = scannedTags.map(t => String(t).trim().toUpperCase());

        // 1. Fetch all expected physical copies assigned to this shelf
        const expectedCopies = await prisma.bookCopy.findMany({
            where: { shelfId: parsedShelfId },
            include: {
                book: { select: { id: true, title: true, author: true, isbn: true } }
            }
        });

        // 2. Fetch records of all scanned tags across the whole library to identify misplaced books
        const scannedCopiesRecords = await prisma.bookCopy.findMany({
            where: { rfidTag: { in: cleanScannedTags } },
            include: {
                book: { select: { id: true, title: true, author: true, isbn: true } },
                shelf: true
            }
        });

        const scannedRecordsByTag = new Map(scannedCopiesRecords.map(c => [c.rfidTag.toUpperCase(), c]));
        const expectedTagsSet = new Set(expectedCopies.map(c => c.rfidTag.toUpperCase()));
        const scannedTagsSet = new Set(cleanScannedTags);

        // A. Present: Expected on this shelf AND scanned
        const presentCopies = expectedCopies.filter(c => scannedTagsSet.has(c.rfidTag.toUpperCase()));

        // B. Missing: Expected on this shelf but NOT scanned
        const missingCopies = expectedCopies.filter(c => !scannedTagsSet.has(c.rfidTag.toUpperCase()));

        // C. Misplaced: Scanned on this shelf, but assigned to another shelf
        const misplacedCopies = [];
        const unknownTags = [];

        for (const tag of cleanScannedTags) {
            const record = scannedRecordsByTag.get(tag);
            if (!record) {
                unknownTags.push(tag);
            } else if (record.shelfId !== parsedShelfId) {
                misplacedCopies.push({
                    copyId: record.id,
                    accessionNo: record.accessionNo,
                    title: record.book.title,
                    assignedShelf: record.shelf ? `${record.shelf.section} (${record.shelf.rackNumber})` : "Unassigned"
                });
            }
        }

        // Save session record to database
        const session = await prisma.inventoryAuditSession.create({
            data: {
                sessionName: `${targetShelf.section} - Rack ${targetShelf.rackNumber} Audit`,
                conductedBy: String(conductedBy),
                status: "COMPLETED",
                totalExpected: expectedCopies.length,
                totalScanned: cleanScannedTags.length,
                totalMissing: missingCopies.length,
                totalMisplaced: misplacedCopies.length,
                completedAt: new Date()
            }
        });

        const reconciliationRate = expectedCopies.length > 0
            ? Math.round((presentCopies.length / expectedCopies.length) * 100)
            : 100;

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            shelf: targetShelf,
            metrics: {
                totalExpected: expectedCopies.length,
                totalScanned: cleanScannedTags.length,
                presentCount: presentCopies.length,
                missingCount: missingCopies.length,
                misplacedCount: misplacedCopies.length,
                unknownCount: unknownTags.length,
                reconciliationRate: `${reconciliationRate}%`
            },
            presentCopies: presentCopies.map(c => ({
                id: c.id,
                accessionNo: c.accessionNo,
                title: c.book.title,
                status: c.status,
                condition: c.condition
            })),
            missingCopies: missingCopies.map(c => ({
                id: c.id,
                accessionNo: c.accessionNo,
                title: c.book.title,
                status: c.status
            })),
            misplacedCopies,
            unknownTags
        });
    } catch (error) {
        console.error("Bulk audit error:", error);
        return res.status(500).json({ success: false, message: "Inventory audit failed.", error: error.message });
    }
};
