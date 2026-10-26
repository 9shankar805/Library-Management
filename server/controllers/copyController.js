import prisma from "../config/db.js";

/**
 * @desc Get all physical copies for a specific book
 * @route GET /api/books/:id/copies
 */
export const getBookCopies = async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10);
        if (isNaN(bookId)) {
            return res.status(400).json({ success: false, message: "Invalid book ID." });
        }

        const copies = await prisma.bookCopy.findMany({
            where: { bookId },
            include: {
                shelf: true,
                issuedBooks: {
                    where: { isReturned: false },
                    include: {
                        student: {
                            select: {
                                rollNo: true,
                                department: true,
                                user: { select: { username: true, email: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { id: "asc" }
        });

        const formatted = copies.map(c => ({
            id: c.id,
            accessionNo: c.accessionNo,
            barcode: c.barcode,
            rfidTag: c.rfidTag,
            status: c.status,
            condition: c.condition,
            shelf: c.shelf,
            currentLoan: c.issuedBooks[0] || null,
            createdAt: c.createdAt
        }));

        return res.status(200).json({
            success: true,
            count: formatted.length,
            copies: formatted
        });
    } catch (error) {
        console.error("Error fetching book copies:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch book copies.", error: error.message });
    }
};

/**
 * @desc Quick lookup of an individual copy by accessionNo, barcode, or RFID tag
 * @route GET /api/copies/lookup
 */
export const lookupCopy = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: "Search query is required." });
        }

        const term = query.trim();

        const copy = await prisma.bookCopy.findFirst({
            where: {
                OR: [
                    { accessionNo: { equals: term, mode: "insensitive" } },
                    { barcode: { equals: term, mode: "insensitive" } },
                    { rfidTag: { equals: term, mode: "insensitive" } }
                ]
            },
            include: {
                book: {
                    include: {
                        category: true,
                        department: true
                    }
                },
                shelf: true,
                issuedBooks: {
                    where: { isReturned: false },
                    include: {
                        student: {
                            select: {
                                rollNo: true,
                                department: true,
                                user: { select: { username: true, email: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!copy) {
            return res.status(404).json({ success: false, message: `No copy found matching '${term}'.` });
        }

        return res.status(200).json({
            success: true,
            copy: {
                id: copy.id,
                accessionNo: copy.accessionNo,
                barcode: copy.barcode,
                rfidTag: copy.rfidTag,
                status: copy.status,
                condition: copy.condition,
                book: copy.book,
                shelf: copy.shelf,
                currentLoan: copy.issuedBooks[0] || null
            }
        });
    } catch (error) {
        console.error("Error looking up copy:", error);
        return res.status(500).json({ success: false, message: "Lookup failed.", error: error.message });
    }
};

/**
 * @desc Add new physical copies to a book
 * @route POST /api/books/:id/copies
 */
export const addBookCopies = async (req, res) => {
    try {
        const bookId = parseInt(req.params.id, 10);
        const { count = 1, condition = "New", shelfId } = req.body;

        const numCopies = Math.max(1, parseInt(count, 10) || 1);

        const book = await prisma.book.findUnique({
            where: { id: bookId },
            include: {
                availabilities: { include: { shelf: true } }
            }
        });

        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found." });
        }

        const targetShelfId = shelfId ? parseInt(shelfId, 10) : (book.availabilities[0]?.shelfId || null);
        const currentCount = await prisma.bookCopy.count({ where: { bookId } });

        const createdCopies = await prisma.$transaction(async (tx) => {
            const copies = [];
            for (let i = 1; i <= numCopies; i++) {
                const copyNum = currentCount + i;
                const bookIdStr = String(book.id).padStart(4, "0");
                const copyIndexStr = String(copyNum).padStart(2, "0");

                const copy = await tx.bookCopy.create({
                    data: {
                        bookId: book.id,
                        accessionNo: `ACC-2026-${bookIdStr}-${copyIndexStr}`,
                        barcode: `BC${book.isbn.slice(-8)}-${copyIndexStr}`,
                        rfidTag: `E280116060${bookIdStr}${copyIndexStr}`,
                        status: "AVAILABLE",
                        condition: condition || "Good",
                        shelfId: targetShelfId
                    },
                    include: { shelf: true }
                });
                copies.push(copy);
            }

            // Sync bookAvailability
            const availability = book.availabilities[0];
            if (availability) {
                await tx.bookAvailability.update({
                    where: { id: availability.id },
                    data: {
                        totalCopies: availability.totalCopies + numCopies,
                        availableCopies: availability.availableCopies + numCopies
                    }
                });
            } else {
                await tx.bookAvailability.create({
                    data: {
                        bookId: book.id,
                        totalCopies: numCopies,
                        availableCopies: numCopies,
                        shelfId: targetShelfId
                    }
                });
            }

            return copies;
        });

        return res.status(201).json({
            success: true,
            message: `Successfully added ${createdCopies.length} physical copies.`,
            copies: createdCopies
        });
    } catch (error) {
        console.error("Error adding book copies:", error);
        return res.status(500).json({ success: false, message: "Failed to add book copies.", error: error.message });
    }
};

/**
 * @desc Update physical copy status or condition
 * @route PATCH /api/copies/:id
 */
export const updateCopyStatus = async (req, res) => {
    try {
        const copyId = parseInt(req.params.id, 10);
        const { status, condition, shelfId } = req.body;

        const existing = await prisma.bookCopy.findUnique({
            where: { id: copyId },
            include: { book: { include: { availabilities: true } } }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "Copy not found." });
        }

        const validStatuses = ["AVAILABLE", "ISSUED", "RESERVED", "DAMAGED", "LOST", "MAINTENANCE"];
        if (status && !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const newStatus = status ? status.toUpperCase() : existing.status;
        const newCondition = condition || existing.condition;
        const newShelfId = shelfId !== undefined ? (shelfId ? parseInt(shelfId, 10) : null) : existing.shelfId;

        const updated = await prisma.$transaction(async (tx) => {
            const updatedCopy = await tx.bookCopy.update({
                where: { id: copyId },
                data: {
                    status: newStatus,
                    condition: newCondition,
                    shelfId: newShelfId
                },
                include: { shelf: true }
            });

            // If status changed from/to unavailable, adjust availability count
            const wasAvailable = existing.status === "AVAILABLE";
            const isNowAvailable = newStatus === "AVAILABLE";

            if (wasAvailable !== isNowAvailable) {
                const avail = existing.book.availabilities[0];
                if (avail) {
                    const adjustment = isNowAvailable ? 1 : -1;
                    await tx.bookAvailability.update({
                        where: { id: avail.id },
                        data: {
                            availableCopies: Math.max(0, avail.availableCopies + adjustment)
                        }
                    });
                }
            }

            return updatedCopy;
        });

        return res.status(200).json({
            success: true,
            message: "Copy details updated successfully.",
            copy: updated
        });
    } catch (error) {
        console.error("Error updating copy:", error);
        return res.status(500).json({ success: false, message: "Failed to update copy.", error: error.message });
    }
};

/**
 * @desc Decommission / remove a physical copy
 * @route DELETE /api/copies/:id
 */
export const deleteCopy = async (req, res) => {
    try {
        const copyId = parseInt(req.params.id, 10);
        const existing = await prisma.bookCopy.findUnique({
            where: { id: copyId },
            include: {
                issuedBooks: { where: { isReturned: false } },
                book: { include: { availabilities: true } }
            }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "Copy not found." });
        }

        if (existing.issuedBooks.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete a copy that is currently issued out."
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.bookCopy.delete({ where: { id: copyId } });

            const avail = existing.book.availabilities[0];
            if (avail) {
                const isAvail = existing.status === "AVAILABLE";
                await tx.bookAvailability.update({
                    where: { id: avail.id },
                    data: {
                        totalCopies: Math.max(0, avail.totalCopies - 1),
                        availableCopies: isAvail ? Math.max(0, avail.availableCopies - 1) : avail.availableCopies
                    }
                });
            }
        });

        return res.status(200).json({
            success: true,
            message: `Copy ${existing.accessionNo} has been removed from inventory.`
        });
    } catch (error) {
        console.error("Error deleting copy:", error);
        return res.status(500).json({ success: false, message: "Failed to delete copy.", error: error.message });
    }
};
