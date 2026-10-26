import crypto from "crypto";
import prisma from "../config/db.js";
import { dispatchNotification } from "./notificationController.js";

/**
 * Generates a unique, non-sequential cryptographically secure 6-digit random token (100000 - 999999)
 */
export const generateRandomReservationToken = async () => {
    let token = "";
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
        attempts++;
        token = crypto.randomInt(100000, 1000000).toString();
        const found = await prisma.bookReservation.findUnique({
            where: { token }
        });
        if (!found) {
            exists = false;
        }
    }
    return token;
};

/**
 * Helper to get or format the 6-digit token for a reservation
 */
export const formatReservationToken = (resvOrId) => {
    if (!resvOrId) return "000000";
    if (typeof resvOrId === "object") {
        if (resvOrId.token) return String(resvOrId.token);
        return String(100000 + (resvOrId.id || 0));
    }
    const str = String(resvOrId);
    if (/^\d{6}$/.test(str)) {
        return str;
    }
    const num = parseInt(str, 10);
    if (!isNaN(num) && num < 100000) {
        return String(100000 + num);
    }
    return str;
};

/**
 * Helper to parse a reservation ID or token string
 */
export const parseReservationToken = (token) => {
    if (!token) return null;
    const clean = String(token).trim().toUpperCase().replace(/^TOK-/i, "").replace(/\D/g, "");
    if (!clean) return null;
    return clean;
};

/**
 * Helper: Processes all active reservations older than 30 minutes,
 * marks them as 'Expired', and restores the reserved copy back into available stock.
 */
export const processExpiredReservations = async () => {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Fetch or create 'Reserved' and 'Expired' statuses
        let reservedStatus = await prisma.status.findFirst({ where: { status: "Reserved" } });
        let expiredStatus = await prisma.status.findFirst({ where: { status: "Expired" } });
        if (!expiredStatus) {
            expiredStatus = await prisma.status.create({ data: { status: "Expired" } });
        }

        if (!reservedStatus) {
            return { success: true, expiredCount: 0, restoredCount: 0 };
        }

        // Find all active reservations that have exceeded the 30-minute window
        const expiredReservations = await prisma.bookReservation.findMany({
            where: {
                statusId: reservedStatus.id,
                reservedDate: { lt: thirtyMinutesAgo }
            }
        });

        if (expiredReservations.length === 0) {
            return { success: true, expiredCount: 0, restoredCount: 0 };
        }

        let restoredCount = 0;
        for (const resv of expiredReservations) {
            await prisma.$transaction(async (tx) => {
                // 1. Update reservation status to Expired
                await tx.bookReservation.update({
                    where: { id: resv.id },
                    data: { statusId: expiredStatus.id }
                });

                // 2. Return the reserved book back into available stock
                if (resv.bookId) {
                    const availability = await tx.bookAvailability.findFirst({
                        where: { bookId: resv.bookId }
                    });

                    if (availability) {
                        const newAvailable = Math.min(
                            availability.totalCopies,
                            availability.availableCopies + 1
                        );
                        await tx.bookAvailability.update({
                            where: { id: availability.id },
                            data: { availableCopies: newAvailable }
                        });
                        restoredCount++;
                    }
                }
            });
        }

        if (restoredCount > 0) {
            console.log(`⏱️ [Auto-Expiry] Processed ${expiredReservations.length} expired reservation(s) and restored ${restoredCount} book copy/copies back into available stock.`);
        }

        return {
            success: true,
            expiredCount: expiredReservations.length,
            restoredCount
        };
    } catch (error) {
        console.error("Error processing expired reservations:", error);
        return { success: false, error: error.message };
    }
};

/**
 * @desc Get all reservations with real-time expiration calculations and 30-minute claim timer
 * @route GET /api/reservations
 */
export const getReservations = async (req, res) => {
    try {
        // Automatically synchronize and expire overdue reservations first
        await processExpiredReservations();

        const { studentId, bookId, status } = req.query;
        const whereClause = {};

        if (studentId) whereClause.studentId = studentId;
        if (bookId) whereClause.bookId = parseInt(bookId, 10);
        if (status) whereClause.status = { status };

        const reservations = await prisma.bookReservation.findMany({
            where: whereClause,
            include: {
                student: {
                    select: {
                        rollNo: true,
                        department: true,
                        yearOfStudy: true,
                        user: { select: { username: true, email: true } }
                    }
                },
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        availabilities: {
                            include: {
                                shelf: { select: { id: true, section: true, rackNumber: true } }
                            }
                        }
                    }
                },
                status: true
            },
            orderBy: { reservedDate: "desc" }
        });

        const now = Date.now();
        const enrichedReservations = reservations.map((resv) => {
            const reservedTime = new Date(resv.reservedDate).getTime();
            const expiresTime = reservedTime + 30 * 60 * 1000; // 30 minutes
            const remainingMs = Math.max(0, expiresTime - now);
            const isExpired = now >= expiresTime;

            const minutesRemaining = Math.floor(remainingMs / 60000);
            const secondsRemaining = Math.floor((remainingMs % 60000) / 1000);

            // 6-digit numeric token
            const token = resv.token || formatReservationToken(resv.id);

            return {
                ...resv,
                token,
                expiresAt: new Date(expiresTime).toISOString(),
                remainingMs,
                minutesRemaining,
                secondsRemaining,
                formattedRemaining: `${String(minutesRemaining).padStart(2, "0")}:${String(secondsRemaining).padStart(2, "0")}`,
                isExpired
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedReservations.length,
            reservations: enrichedReservations
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reservations.",
            error: error.message
        });
    }
};

/**
 * @desc Create a new book reservation with 30-minute hold window, stock decrement, and 6-digit token response
 * @route POST /api/reservations
 */
export const createReservation = async (req, res) => {
    try {
        // Synchronize expired reservations first
        await processExpiredReservations();

        const { studentId, bookId } = req.body;
        if (!studentId || !bookId) {
            return res.status(400).json({
                success: false,
                message: "studentId (Roll No) and bookId are required."
            });
        }

        const parsedBookId = parseInt(bookId, 10);
        if (isNaN(parsedBookId)) {
            return res.status(400).json({ success: false, message: "Invalid book ID." });
        }

        // 1. Verify student exists
        const student = await prisma.student.findUnique({
            where: { rollNo: studentId },
            include: { user: { select: { username: true, email: true } } }
        });
        if (!student) {
            return res.status(404).json({ success: false, message: `Student ${studentId} not found.` });
        }

        // Do not create a reservation once the student already holds the
        // configured maximum number of unreturned books.
        const constants = await prisma.libraryConstants.findFirst() || { maxBooksPerStudent: 3 };
        const activeIssuedCount = await prisma.issuedBook.count({
            where: { studentId, isReturned: false }
        });
        if (activeIssuedCount >= constants.maxBooksPerStudent) {
            return res.status(400).json({
                success: false,
                limitExceeded: "ACTIVE_BORROW_LIMIT",
                message: `You already hold the maximum of ${constants.maxBooksPerStudent} issued books. Return a book before reserving another one.`,
                activeIssuedCount,
                maxBooksAllowed: constants.maxBooksPerStudent
            });
        }

        // 2. Verify book exists
        const book = await prisma.book.findUnique({
            where: { id: parsedBookId },
            include: {
                availabilities: {
                    include: { shelf: true }
                }
            }
        });
        if (!book) {
            return res.status(404).json({ success: false, message: "Book not found." });
        }

        // 3. Fetch statuses
        let reservedStatus = await prisma.status.findFirst({ where: { status: "Reserved" } });
        if (!reservedStatus) {
            reservedStatus = await prisma.status.create({ data: { status: "Reserved" } });
        }

        let waitlistedStatus = await prisma.status.findFirst({ where: { status: "Waitlisted" } });
        if (!waitlistedStatus) {
            waitlistedStatus = await prisma.status.create({ data: { status: "Waitlisted" } });
        }

        // Check if student is already waitlisted for this book
        const existingWaitlist = await prisma.bookReservation.findFirst({
            where: {
                studentId,
                bookId: parsedBookId,
                statusId: waitlistedStatus.id
            }
        });
        if (existingWaitlist) {
            return res.status(400).json({
                success: false,
                message: `You are already on the waitlist for "${book.title}" at queue position #${existingWaitlist.queuePosition}.`
            });
        }

        // If out of stock, join the smart Waitlist!
        const availability = book.availabilities?.[0];
        if (!availability || availability.availableCopies <= 0) {
            const waitlistCount = await prisma.bookReservation.count({
                where: { bookId: parsedBookId, statusId: waitlistedStatus.id }
            });
            const token = await generateRandomReservationToken();
            const waitlistReservation = await prisma.bookReservation.create({
                data: {
                    token,
                    studentId,
                    bookId: parsedBookId,
                    reservedDate: new Date(),
                    queuePosition: waitlistCount + 1,
                    statusId: waitlistedStatus.id
                },
                include: {
                    student: { select: { rollNo: true, user: { select: { username: true, email: true } } } },
                    book: { select: { id: true, title: true, author: true, isbn: true } },
                    status: true
                }
            });

            const studentEmail = student.user?.email || `${studentId}@student.nitandhra.ac.in`;
            dispatchNotification({
                userId: studentId,
                userEmail: studentEmail,
                userName: student.user?.username || "Student",
                rollNo: studentId,
                type: "GENERAL",
                title: `Waitlist Position #${waitlistCount + 1}: "${book.title}"`,
                message: `All copies of "${book.title}" are currently on loan. You have joined the waitlist at queue position #${waitlistCount + 1}. You will be automatically notified when a copy is returned!`,
                link: "/student/reservations"
            }).catch(e => console.error("Waitlist notice error:", e));

            return res.status(201).json({
                success: true,
                isWaitlisted: true,
                queuePosition: waitlistCount + 1,
                token,
                message: `"${book.title}" is currently on loan. You joined the reservation waitlist at position #${waitlistCount + 1}! You will be notified the instant a copy is returned.`,
                reservation: waitlistReservation
            });
        }

        // 5. Anti-Spam / Rate-Limiting Constraints per Day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const totalReservationsToday = await prisma.bookReservation.count({
            where: {
                studentId,
                reservedDate: { gte: startOfDay }
            }
        });

        if (totalReservationsToday >= 5) {
            return res.status(429).json({
                success: false,
                limitExceeded: "DAILY_STUDENT_QUOTA",
                message: "Daily reservation limit reached: You can only make a maximum of 5 reservation requests per day.",
                totalUsedToday: totalReservationsToday,
                maxDailyAllowed: 5
            });
        }

        const bookReservationsToday = await prisma.bookReservation.count({
            where: {
                studentId,
                bookId: parsedBookId,
                reservedDate: { gte: startOfDay }
            }
        });

        if (bookReservationsToday >= 2) {
            return res.status(429).json({
                success: false,
                limitExceeded: "DAILY_BOOK_QUOTA",
                message: `Daily limit reached for this book: You can only reserve "${book.title}" a maximum of 2 times per day.`,
                bookUsedToday: bookReservationsToday,
                maxPerBookAllowed: 2
            });
        }

        // 6. Check if student already has an active reservation for this book
        const existingActiveReservation = await prisma.bookReservation.findFirst({
            where: {
                studentId,
                bookId: parsedBookId,
                statusId: reservedStatus.id
            }
        });
        if (existingActiveReservation) {
            const activeToken = existingActiveReservation.token || formatReservationToken(existingActiveReservation.id);
            return res.status(400).json({
                success: false,
                message: `You already have an active reservation for "${book.title}". Your 6-digit verification code is ${activeToken}. Please claim it before it expires.`
            });
        }

        // 7. Calculate queue position
        const currentQueueCount = await prisma.bookReservation.count({
            where: { bookId: parsedBookId, statusId: reservedStatus.id }
        });

        const reservedDate = new Date();
        const expiresAt = new Date(reservedDate.getTime() + 30 * 60 * 1000);

        // 8. Generate a non-sequential random 6-digit token
        const token = await generateRandomReservationToken();

        // 9. Atomically create reservation and decrement available stock by 1 (making it unavailable)
        const result = await prisma.$transaction(async (tx) => {
            // Decrement available copies
            const updatedAvailability = await tx.bookAvailability.update({
                where: { id: availability.id },
                data: { availableCopies: Math.max(0, availability.availableCopies - 1) }
            });

            // Create reservation record with random token
            const newReservation = await tx.bookReservation.create({
                data: {
                    token,
                    studentId,
                    bookId: parsedBookId,
                    reservedDate,
                    expiresAt,
                    queuePosition: currentQueueCount + 1,
                    statusId: reservedStatus.id
                },
                include: {
                    student: { select: { rollNo: true, user: { select: { username: true, email: true } } } },
                    book: { select: { id: true, title: true, author: true, isbn: true } },
                    status: true
                }
            });

            return { reservation: newReservation, availability: updatedAvailability };
        }, { maxWait: 10000, timeout: 15000 });

        // Dispatch instant Reservation Ready notification & email
        const studentEmail = student.user?.email || `${studentId}@student.nitandhra.ac.in`;
        dispatchNotification({
            userId: studentId,
            userEmail: studentEmail,
            userName: student.user?.username || "Student",
            rollNo: studentId,
            type: "RESERVATION_READY",
            title: `Reservation Confirmed: "${book.title}"`,
            message: `Your reservation token is #${token}. Please pick up your copy from the circulation desk within 48 hours.`,
            link: "/student/reservations",
            metadata: {
                bookTitle: book.title,
                token,
                pickupDeadline: expiresAt
            }
        }).catch(e => console.error("Reservation notice error:", e));

        return res.status(201).json({
            success: true,
            message: `Book "${book.title}" reserved successfully! Your 6-digit verification code is ${token}. Please collect and claim it within 30 minutes.`,
            token,
            reservation: {
                ...result.reservation,
                token,
                expiresAt: expiresAt.toISOString(),
                minutesAllowed: 30,
                remainingMs: 30 * 60 * 1000
            },
            updatedStock: {
                totalCopies: result.availability.totalCopies,
                availableCopies: result.availability.availableCopies
            }
        });

    } catch (error) {
        console.error("Error creating reservation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create reservation.",
            error: error.message
        });
    }
};

/**
 * @desc Cancel a reservation and immediately return the reserved book copy back into available stock
 * @route PATCH /api/reservations/:id/cancel
 */
export const cancelReservation = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid reservation ID." });
        }

        const reservation = await prisma.bookReservation.findUnique({
            where: { id },
            include: { status: true, book: true }
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        // Fetch or create statuses
        let cancelledStatus = await prisma.status.findFirst({ where: { status: "Cancelled" } });
        if (!cancelledStatus) {
            cancelledStatus = await prisma.status.create({ data: { status: "Cancelled" } });
        }

        // Status flags
        const wasActive = reservation.status?.status === "Reserved";
        const wasWaitlisted = reservation.status?.status === "Waitlisted";

        let waitlistedStatus = await prisma.status.findFirst({ where: { status: "Waitlisted" } });
        let reservedStatus = await prisma.status.findFirst({ where: { status: "Reserved" } });

        const result = await prisma.$transaction(async (tx) => {
            // Update reservation status to Cancelled
            const updated = await tx.bookReservation.update({
                where: { id },
                data: { statusId: cancelledStatus.id },
                include: {
                    status: true,
                    book: { select: { id: true, title: true } },
                    student: { select: { rollNo: true, user: { select: { username: true } } } }
                }
            });

            let updatedAvailability = null;
            let promotedWaitlist = null;

            // If active hold was cancelled, check if we can promote a waitlisted student
            if (wasActive && reservation.bookId && waitlistedStatus && reservedStatus) {
                const nextWaitlist = await tx.bookReservation.findFirst({
                    where: {
                        bookId: reservation.bookId,
                        statusId: waitlistedStatus.id
                    },
                    orderBy: { queuePosition: "asc" },
                    include: { student: { include: { user: true } }, book: true }
                });

                if (nextWaitlist) {
                    const pickupDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
                    promotedWaitlist = await tx.bookReservation.update({
                        where: { id: nextWaitlist.id },
                        data: {
                            statusId: reservedStatus.id,
                            expiresAt: pickupDeadline
                        },
                        include: { student: { include: { user: true } }, book: true }
                    });
                } else {
                    // No waitlist: restore copy back to available stock
                    const availability = await tx.bookAvailability.findFirst({
                        where: { bookId: reservation.bookId }
                    });

                    if (availability) {
                        updatedAvailability = await tx.bookAvailability.update({
                            where: { id: availability.id },
                            data: {
                                availableCopies: Math.min(
                                    availability.totalCopies,
                                    availability.availableCopies + 1
                                )
                            }
                        });
                    }
                }
            }

            // If a waitlisted reservation was cancelled, re-index subsequent waitlist positions
            if (wasWaitlisted && reservation.bookId && waitlistedStatus) {
                const subsequentWaitlist = await tx.bookReservation.findMany({
                    where: {
                        bookId: reservation.bookId,
                        statusId: waitlistedStatus.id,
                        queuePosition: { gt: reservation.queuePosition }
                    }
                });

                for (const sub of subsequentWaitlist) {
                    await tx.bookReservation.update({
                        where: { id: sub.id },
                        data: { queuePosition: Math.max(1, sub.queuePosition - 1) }
                    });
                }
            }

            return { updated, updatedAvailability, promotedWaitlist };
        }, { maxWait: 10000, timeout: 15000 });

        // If a waitlisted student was promoted, dispatch instant alert!
        if (result.promotedWaitlist) {
            const promoted = result.promotedWaitlist;
            const promotedEmail = promoted.student?.user?.email || `${promoted.studentId}@student.nitandhra.ac.in`;
            dispatchNotification({
                userId: promoted.studentId,
                userEmail: promotedEmail,
                userName: promoted.student?.user?.username || "Student",
                rollNo: promoted.studentId,
                type: "RESERVATION_READY",
                title: `🎉 Copy Ready: "${promoted.book?.title}"`,
                message: `A held copy of "${promoted.book?.title}" has become available! Present token #${promoted.token} at the circulation desk within 48 hours.`,
                link: "/student/reservations",
                metadata: {
                    bookTitle: promoted.book?.title,
                    token: promoted.token,
                    pickupDeadline: promoted.expiresAt
                }
            }).catch(e => console.error("Waitlist ready alert error:", e));
        }

        return res.status(200).json({
            success: true,
            message: result.promotedWaitlist
                ? "Reservation cancelled and copy automatically allocated to the next waitlisted student!"
                : "Reservation cancelled successfully.",
            reservation: result.updated,
            waitlistPromoted: !!result.promotedWaitlist,
            updatedStock: result.updatedAvailability ? {
                totalCopies: result.updatedAvailability.totalCopies,
                availableCopies: result.updatedAvailability.availableCopies
            } : undefined
        });

    } catch (error) {
        console.error("Error cancelling reservation:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel reservation.",
            error: error.message
        });
    }
};

/**
 * @desc Verify a 6-digit reservation token AND update that book as Issued
 * @route POST /api/reservations/verify-token
 * @payload { token: string, dueDate?: string, verifyOnly?: boolean }
 */
export const verifyReservationToken = async (req, res) => {
    try {
        await processExpiredReservations();

        const { token, dueDate: customDueDate, verifyOnly = false } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "6-digit token is required." });
        }

        const cleanedToken = String(token).trim().toUpperCase().replace(/^TOK-/i, "");
        if (!cleanedToken) {
            return res.status(400).json({
                success: false,
                message: `Invalid token format. Please provide a valid 6-digit code.`
            });
        }

        // 1. Direct lookup by random token
        let reservation = await prisma.bookReservation.findFirst({
            where: { token: cleanedToken },
            include: {
                student: {
                    include: { user: { select: { username: true, email: true } } }
                },
                book: {
                    include: {
                        availabilities: { include: { shelf: true } }
                    }
                },
                status: true
            }
        });

        // 2. Legacy fallback lookup for sequential tokens (100000 + id) or raw id (only for legacy records)
        if (!reservation) {
            const rawDigits = cleanedToken.replace(/\D/g, "");
            const num = parseInt(rawDigits, 10);
            if (!isNaN(num)) {
                const legacyId = num > 100000 ? num - 100000 : num;
                const candidate = await prisma.bookReservation.findUnique({
                    where: { id: legacyId },
                    include: {
                        student: {
                            include: { user: { select: { username: true, email: true } } }
                        },
                        book: {
                            include: {
                                availabilities: { include: { shelf: true } }
                            }
                        },
                        status: true
                    }
                });
                // Legacy fallback only matches if candidate does not have a separate random token
                if (candidate && (!candidate.token || candidate.token === String(num) || candidate.token === String(100000 + candidate.id))) {
                    reservation = candidate;
                }
            }
        }

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: `Invalid token. No reservation found for code "${token}".`
            });
        }

        const now = Date.now();
        const reservedTime = new Date(reservation.reservedDate).getTime();
        const expiresTime = reservedTime + 30 * 60 * 1000;
        const isExpired = now >= expiresTime || reservation.status?.status === "Expired";

        if (isExpired) {
            return res.status(400).json({
                success: false,
                isExpired: true,
                message: "This reservation has expired (exceeded 30 minutes window). The book copy has already been returned to available stock.",
                reservation
            });
        }

        if (reservation.status?.status !== "Reserved") {
            return res.status(400).json({
                success: false,
                message: `Reservation is no longer active. Current status: ${reservation.status?.status}.`
            });
        }

        // Re-check at issue time: a reservation can predate a later issue that
        // brought the student to the active-loan limit.
        const constants = await prisma.libraryConstants.findFirst() || {
            maxBorrowDays: 14,
            maxBooksPerStudent: 3
        };
        const activeIssuedCount = await prisma.issuedBook.count({
            where: { studentId: reservation.studentId, isReturned: false }
        });
        if (activeIssuedCount >= constants.maxBooksPerStudent) {
            return res.status(400).json({
                success: false,
                limitExceeded: "ACTIVE_BORROW_LIMIT",
                message: `Student already holds the maximum of ${constants.maxBooksPerStudent} issued books. Return a book before issuing this reservation.`,
                activeIssuedCount,
                maxBooksAllowed: constants.maxBooksPerStudent
            });
        }

        // Fetch library constants for default loan duration (14 days)
        const issueDate = new Date();
        const calculatedDueDate = customDueDate
            ? new Date(customDueDate)
            : new Date(Date.now() + (constants.maxBorrowDays || 14) * 24 * 60 * 60 * 1000);

        // Fetch or create 'Issued' / 'Completed' status
        let issuedStatus = await prisma.status.findFirst({ where: { status: "Issued" } });
        if (!issuedStatus) {
            issuedStatus = await prisma.status.create({ data: { status: "Issued" } });
        }

        if (verifyOnly) {
            const formattedToken = reservation.token || formatReservationToken(reservation.id);
            const remainingMs = Math.max(0, expiresTime - now);

            return res.status(200).json({
                success: true,
                message: "Reservation token is valid and active!",
                verificationDetails: {
                    reservationId: reservation.id,
                    token: formattedToken,
                    studentName: reservation.student?.user?.username,
                    rollNo: reservation.studentId,
                    email: reservation.student?.user?.email,
                    department: reservation.student?.department,
                    bookId: reservation.book?.id,
                    bookTitle: reservation.book?.title,
                    author: reservation.book?.author,
                    isbn: reservation.book?.isbn,
                    shelf: reservation.book?.availabilities?.[0]?.shelf,
                    reservedDate: reservation.reservedDate,
                    expiresAt: new Date(expiresTime).toISOString(),
                    minutesRemaining: Math.floor(remainingMs / 60000),
                    secondsRemaining: Math.floor((remainingMs % 60000) / 1000)
                }
            });
        }

        // Perform atomic verification and issuance:
        // 1. Create IssuedBook
        // 2. Create BorrowHistory
        // 3. Update reservation status to "Issued"
        // Note: availableCopies was already decremented during reservation, so total stock and available stock remain consistent.
        const result = await prisma.$transaction(async (tx) => {
            // Create IssuedBook record
            const issuedBookRecord = await tx.issuedBook.create({
                data: {
                    bookId: reservation.bookId,
                    studentId: reservation.studentId,
                    issueDate,
                    dueDate: calculatedDueDate,
                    isReturned: false,
                    renewalCount: 0
                },
                include: {
                    student: { select: { rollNo: true, department: true, user: { select: { username: true, email: true } } } },
                    book: { select: { id: true, title: true, author: true, isbn: true } }
                }
            });

            // Create BorrowHistory record
            await tx.borrowHistory.create({
                data: {
                    studentId: reservation.studentId,
                    bookId: reservation.bookId,
                    issueDate
                }
            });

            // Update reservation status to 'Issued'
            const updatedReservation = await tx.bookReservation.update({
                where: { id: reservation.id },
                data: { statusId: issuedStatus.id },
                include: { status: true }
            });

            return { issuedBookRecord, updatedReservation };
        }, { maxWait: 10000, timeout: 15000 });

        const formattedToken = reservation.token || formatReservationToken(reservation.id);

        return res.status(200).json({
            success: true,
            message: `Token ${formattedToken} verified successfully! Book "${reservation.book?.title}" has been issued to student ${reservation.studentId}.`,
            isIssued: true,
            transactionId: `TXN-${result.issuedBookRecord.id.toString().padStart(4, "0")}`,
            token: formattedToken,
            issuedBook: result.issuedBookRecord,
            reservation: result.updatedReservation,
            issueDetails: {
                transactionId: `TXN-${result.issuedBookRecord.id.toString().padStart(4, "0")}`,
                studentName: reservation.student?.user?.username,
                rollNo: reservation.studentId,
                email: reservation.student?.user?.email,
                bookTitle: reservation.book?.title,
                isbn: reservation.book?.isbn,
                issueDate: issueDate.toISOString(),
                dueDate: calculatedDueDate.toISOString()
            }
        });

    } catch (error) {
        console.error("Error in verifyReservationToken:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify token and issue book.",
            error: error.message
        });
    }
};

/**
 * @desc Explicitly trigger check for expired reservations and restore stock
 * @route POST /api/reservations/check-expired
 */
export const triggerExpiredCheck = async (req, res) => {
    try {
        const result = await processExpiredReservations();
        return res.status(200).json({
            success: true,
            message: `Expired reservations check complete.`,
            ...result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to process expired reservations.",
            error: error.message
        });
    }
};

/**
 * @desc Get student's current daily reservation quota usage & remaining allowances
 * @route GET /api/reservations/quota/:studentId
 */
export const getStudentReservationQuota = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { bookId } = req.query;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const totalUsedToday = await prisma.bookReservation.count({
            where: {
                studentId,
                reservedDate: { gte: startOfDay }
            }
        });

        let bookUsedToday = 0;
        if (bookId) {
            bookUsedToday = await prisma.bookReservation.count({
                where: {
                    studentId,
                    bookId: parseInt(bookId, 10),
                    reservedDate: { gte: startOfDay }
                }
            });
        }

        const maxDaily = 5;
        const maxPerBook = 2;

        return res.status(200).json({
            success: true,
            studentId,
            quota: {
                totalDailyLimit: maxDaily,
                totalUsedToday,
                totalRemainingToday: Math.max(0, maxDaily - totalUsedToday),
                maxPerBookDailyLimit: maxPerBook,
                ...(bookId && {
                    bookId: parseInt(bookId, 10),
                    bookUsedToday,
                    bookRemainingToday: Math.max(0, maxPerBook - bookUsedToday)
                })
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch reservation quota.",
            error: error.message
        });
    }
};
