import prisma from "../config/db.js";
import { dispatchNotification } from "./notificationController.js";

/**
 * @desc Get all issued books (active or returned)
 * @route GET /api/issued-books
 */
export const getIssuedBooks = async (req, res) => {
    try {
        const { isReturned, studentId } = req.query;
        const whereClause = {};

        if (isReturned !== undefined) {
            whereClause.isReturned = isReturned === "true";
        }
        if (studentId) {
            whereClause.studentId = studentId;
        }

        const issuedBooks = await prisma.issuedBook.findMany({
            where: whereClause,
            include: {
                student: { select: { rollNo: true, department: true, user: { select: { username: true, email: true } } } },
                book: { select: { id: true, title: true, author: true, isbn: true } },
                copy: {
                    select: {
                        id: true,
                        accessionNo: true,
                        barcode: true,
                        rfidTag: true,
                        condition: true,
                        shelf: true
                    }
                },
                fines: true
            },
            orderBy: { issueDate: "desc" }
        });

        return res.status(200).json({ success: true, count: issuedBooks.length, issuedBooks });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch issued books.", error: error.message });
    }
};

/**
 * @desc Issue a book to a student
 * @route POST /api/issued-books
 */
export const issueBook = async (req, res) => {
    try {
        const { studentId, bookId, copyId, accessionNo, barcode } = req.body;
        if (!studentId || (!bookId && !copyId && !accessionNo && !barcode)) {
            return res.status(400).json({ success: false, message: "studentId (Roll No) and either bookId, copyId, accessionNo, or barcode are required." });
        }

        // 1. Find specific copy if identifier provided
        let targetCopy = null;
        if (copyId) {
            targetCopy = await prisma.bookCopy.findUnique({ where: { id: parseInt(copyId, 10) } });
        } else if (accessionNo) {
            targetCopy = await prisma.bookCopy.findFirst({ where: { accessionNo: { equals: accessionNo.trim(), mode: "insensitive" } } });
        } else if (barcode) {
            targetCopy = await prisma.bookCopy.findFirst({ where: { barcode: { equals: barcode.trim(), mode: "insensitive" } } });
        }

        if (targetCopy && targetCopy.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: `Copy ${targetCopy.accessionNo} is currently ${targetCopy.status} and cannot be issued.`
            });
        }

        let parsedBookId = targetCopy ? targetCopy.bookId : parseInt(bookId, 10);

        if (!targetCopy) {
            // Auto-assign first available physical copy
            targetCopy = await prisma.bookCopy.findFirst({
                where: { bookId: parsedBookId, status: "AVAILABLE" }
            });
        }

        // 2. Verify student exists
        const student = await prisma.student.findUnique({ where: { rollNo: studentId } });
        if (!student) {
            return res.status(404).json({ success: false, message: `Student ${studentId} not found.` });
        }

        // 3. Fetch library constants
        const constants = await prisma.libraryConstants.findFirst() || { maxBorrowDays: 14, maxBooksPerStudent: 3 };

        // 4. Check active borrowings limit
        const activeCount = await prisma.issuedBook.count({
            where: { studentId, isReturned: false }
        });

        if (activeCount >= constants.maxBooksPerStudent) {
            return res.status(400).json({
                success: false,
                message: `Student has reached the maximum borrowing limit of ${constants.maxBooksPerStudent} books.`
            });
        }

        // 5. Check if student has an active reservation for this book
        let reservedStatus = await prisma.status.findFirst({ where: { status: "Reserved" } });
        let completedStatus = await prisma.status.findFirst({ where: { status: "Completed" } });
        if (!completedStatus) {
            completedStatus = await prisma.status.create({ data: { status: "Completed" } });
        }

        const activeReservation = reservedStatus ? await prisma.bookReservation.findFirst({
            where: {
                studentId,
                bookId: parsedBookId,
                statusId: reservedStatus.id
            }
        }) : null;

        const availability = await prisma.bookAvailability.findFirst({
            where: { bookId: parsedBookId }
        });

        // If not previously reserved, verify stock is available
        if (!activeReservation) {
            if (!availability || availability.availableCopies <= 0) {
                return res.status(400).json({ success: false, message: "Book is currently out of stock / unavailable." });
            }
        }

        // 6. Calculate due date
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + constants.maxBorrowDays);

        // Perform transaction
        const result = await prisma.$transaction(async (tx) => {
            // Decrement available copies ONLY if the copy was not already held by an active reservation
            if (!activeReservation && availability) {
                await tx.bookAvailability.update({
                    where: { id: availability.id },
                    data: { availableCopies: Math.max(0, availability.availableCopies - 1) }
                });
            }

            // Mark specific physical copy as ISSUED
            if (targetCopy) {
                await tx.bookCopy.update({
                    where: { id: targetCopy.id },
                    data: { status: "ISSUED" }
                });
            }

            // If the student had an active reservation, mark it as Completed so it doesn't expire later
            if (activeReservation) {
                await tx.bookReservation.update({
                    where: { id: activeReservation.id },
                    data: { statusId: completedStatus.id }
                });
            }

            // Create IssuedBook
            const issued = await tx.issuedBook.create({
                data: {
                    bookId: parsedBookId,
                    copyId: targetCopy?.id || null,
                    studentId,
                    issueDate,
                    dueDate,
                    isReturned: false,
                    renewalCount: 0
                },
                include: {
                    student: { select: { rollNo: true, user: { select: { username: true } } } },
                    book: { select: { id: true, title: true, isbn: true } },
                    copy: { select: { id: true, accessionNo: true, barcode: true, rfidTag: true, condition: true, shelf: true } }
                }
            });

            // Create BorrowHistory record
            await tx.borrowHistory.create({
                data: {
                    studentId,
                    bookId: parsedBookId,
                    issueDate
                }
            });

            return issued;
        });

        // Dispatch Digital Issue Receipt Notification & Email
        prisma.student.findUnique({
            where: { rollNo: studentId },
            include: { user: true }
        }).then(studentObj => {
            const studentEmail = studentObj?.user?.email || `${studentId}@student.nitandhra.ac.in`;
            dispatchNotification({
                userId: studentId,
                userEmail: studentEmail,
                userName: studentObj?.user?.username || "Student",
                rollNo: studentId,
                type: "RECEIPT",
                title: `Checkout Receipt: "${book?.title || 'Book'}"`,
                message: `You have successfully checked out "${book?.title}". Return due date is ${new Date(result.dueDate).toLocaleDateString()}.`,
                link: "/student/profile",
                metadata: {
                    receiptType: "ISSUE",
                    bookTitle: book?.title || "Book",
                    accessionNo: targetCopy?.accessionNo,
                    barcode: targetCopy?.barcode,
                    issueDate: result.issueDate,
                    dueDate: result.dueDate,
                    txnId: result.id
                }
            }).catch(e => console.error("Issue receipt dispatch error:", e));
        }).catch(e => console.error("Student lookup error:", e));

        return res.status(201).json({
            success: true,
            message: activeReservation
                ? "Book issued successfully and reservation marked as completed."
                : "Book issued successfully.",
            issuedBook: result,
            reservationClaimed: !!activeReservation
        });

    } catch (error) {
        console.error("Error issuing book:", error);
        return res.status(500).json({ success: false, message: "Failed to issue book.", error: error.message });
    }
};

/**
 * @desc Return an issued book (calculates fine if overdue)
 * @route POST /api/issued-books/:id/return
 */
export const returnBook = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const issuedRecord = await prisma.issuedBook.findUnique({
            where: { id },
            include: { book: true, student: true }
        });

        if (!issuedRecord) {
            return res.status(404).json({ success: false, message: "Issued book record not found." });
        }
        if (issuedRecord.isReturned) {
            return res.status(400).json({ success: false, message: "Book has already been returned." });
        }

        const returnDate = new Date();
        const dueDate = new Date(issuedRecord.dueDate);
        const constants = await prisma.libraryConstants.findFirst() || { overdueFinePerDay: 5.00 };

        let fineCreated = null;

        // Check if overdue
        if (returnDate > dueDate) {
            const diffTime = Math.abs(returnDate - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const fineAmount = diffDays * Number(constants.overdueFinePerDay);

            let fineType = await prisma.fineType.findFirst({ where: { type: "Overdue Return" } });
            if (!fineType) {
                fineType = await prisma.fineType.create({ data: { type: "Overdue Return" } });
            }

            fineCreated = {
                studentId: issuedRecord.studentId,
                issuedBookId: issuedRecord.id,
                fineTypeId: fineType.id,
                amount: fineAmount,
                description: `Overdue return by ${diffDays} day(s) @ ₹${constants.overdueFinePerDay}/day.`
            };
        }

        // Perform transaction
        const result = await prisma.$transaction(async (tx) => {
            // Mark as returned
            const updated = await tx.issuedBook.update({
                where: { id },
                data: { isReturned: true, returnDate }
            });

            // Update BorrowHistory returnDate
            const history = await tx.borrowHistory.findFirst({
                where: { studentId: issuedRecord.studentId, bookId: issuedRecord.bookId, returnDate: null }
            });
            if (history) {
                await tx.borrowHistory.update({
                    where: { id: history.id },
                    data: { returnDate }
                });
            }

            // Check if there are waitlisted students waiting for this book!
            let waitlistedStatus = await tx.status.findFirst({ where: { status: "Waitlisted" } });
            let reservedStatus = await tx.status.findFirst({ where: { status: "Reserved" } });
            let promotedReservation = null;

            if (waitlistedStatus && reservedStatus && issuedRecord.bookId) {
                const nextWaitlist = await tx.bookReservation.findFirst({
                    where: {
                        bookId: issuedRecord.bookId,
                        statusId: waitlistedStatus.id
                    },
                    orderBy: { queuePosition: "asc" },
                    include: { student: { include: { user: true } }, book: true }
                });

                if (nextWaitlist) {
                    const pickupDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
                    promotedReservation = await tx.bookReservation.update({
                        where: { id: nextWaitlist.id },
                        data: {
                            statusId: reservedStatus.id,
                            copyId: issuedRecord.copyId || undefined,
                            expiresAt: pickupDeadline
                        },
                        include: { student: { include: { user: true } }, book: true }
                    });

                    // Mark physical copy as RESERVED for this student
                    if (issuedRecord.copyId) {
                        await tx.bookCopy.update({
                            where: { id: issuedRecord.copyId },
                            data: { status: "RESERVED" }
                        });
                    }
                }
            }

            // If not claimed by a waitlist, restore copy to AVAILABLE and increment availability
            if (!promotedReservation) {
                if (issuedRecord.copyId) {
                    await tx.bookCopy.update({
                        where: { id: issuedRecord.copyId },
                        data: { status: "AVAILABLE" }
                    });
                }

                if (issuedRecord.bookId) {
                    const availability = await tx.bookAvailability.findFirst({ where: { bookId: issuedRecord.bookId } });
                    if (availability) {
                        await tx.bookAvailability.update({
                            where: { id: availability.id },
                            data: { availableCopies: availability.availableCopies + 1 }
                        });
                    }
                }
            }

            // Create fine if applicable
            let fine = null;
            if (fineCreated) {
                fine = await tx.fine.create({ data: fineCreated });
            }

            return { updated, fine, promotedReservation };
        });

        // 1. Dispatch Digital Return Receipt to returning student
        const returningEmail = issuedRecord.student?.user?.email || `${issuedRecord.studentId}@student.nitandhra.ac.in`;
        dispatchNotification({
            userId: issuedRecord.studentId,
            userEmail: returningEmail,
            userName: issuedRecord.student?.user?.username || "Student",
            rollNo: issuedRecord.studentId,
            type: "RECEIPT",
            title: `✓ Book Returned: "${issuedRecord.book?.title}"`,
            message: `Your return for "${issuedRecord.book?.title}" has been confirmed.${result.fine ? ` Overdue fine assessed: ₹${result.fine.amount}.` : ' No fines accrued.'}`,
            link: "/student/profile",
            metadata: {
                receiptType: "RETURN",
                bookTitle: issuedRecord.book?.title || "Book",
                returnDate: new Date(),
                fineAmount: result.fine ? result.fine.amount : 0
            }
        }).catch(e => console.error("Return receipt error:", e));

        // 2. If a waitlisted student was promoted, dispatch Instant Ready For Pickup alert!
        if (result.promotedReservation) {
            const promoted = result.promotedReservation;
            const promotedEmail = promoted.student?.user?.email || `${promoted.studentId}@student.nitandhra.ac.in`;
            dispatchNotification({
                userId: promoted.studentId,
                userEmail: promotedEmail,
                userName: promoted.student?.user?.username || "Student",
                rollNo: promoted.studentId,
                type: "RESERVATION_READY",
                title: `🎉 Copy Ready: "${promoted.book?.title}"`,
                message: `A returned copy of "${promoted.book?.title}" is now held for you at the circulation desk. Present token #${promoted.token} within 48 hours.`,
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
            message: result.promotedReservation
                ? "Book returned successfully and allocated to the next waitlisted student!"
                : "Book returned successfully.",
            returnDetails: result.updated,
            fineGenerated: result.fine,
            waitlistPromoted: !!result.promotedReservation
        });

    } catch (error) {
        console.error("Error returning book:", error);
        return res.status(500).json({ success: false, message: "Failed to return book.", error: error.message });
    }
};

/**
 * @desc Renew an issued book loan
 * @route POST /api/issued-books/:id/renew
 */
export const renewBook = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const issuedRecord = await prisma.issuedBook.findUnique({
            where: { id },
            include: { book: true, student: { include: { user: true } } }
        });

        if (!issuedRecord) {
            return res.status(404).json({ success: false, message: "Issued book record not found." });
        }
        if (issuedRecord.isReturned) {
            return res.status(400).json({ success: false, message: "Cannot renew a returned book." });
        }

        const constants = await prisma.libraryConstants.findFirst() || { maxRenewals: 2, renewalExtendsDays: 7 };

        if (issuedRecord.renewalCount >= constants.maxRenewals) {
            return res.status(400).json({
                success: false,
                message: `Maximum renewal limit of ${constants.maxRenewals} reached.`
            });
        }

        const newDueDate = new Date(issuedRecord.dueDate);
        newDueDate.setDate(newDueDate.getDate() + constants.renewalExtendsDays);

        const updated = await prisma.issuedBook.update({
            where: { id },
            data: {
                dueDate: newDueDate,
                renewalCount: issuedRecord.renewalCount + 1
            }
        });

        // Dispatch renewal receipt
        const renewEmail = issuedRecord.student?.user?.email || `${issuedRecord.studentId}@student.nitandhra.ac.in`;
        dispatchNotification({
            userId: issuedRecord.studentId,
            userEmail: renewEmail,
            userName: issuedRecord.student?.user?.username || "Student",
            rollNo: issuedRecord.studentId,
            type: "RECEIPT",
            title: `Loan Renewed: "${issuedRecord.book?.title}"`,
            message: `Loan successfully extended by +${constants.renewalExtendsDays} days. New due date is ${newDueDate.toLocaleDateString()}. (${updated.renewalCount}/${constants.maxRenewals} renewals used).`,
            link: "/student/profile",
            metadata: {
                receiptType: "RENEWAL",
                bookTitle: issuedRecord.book?.title,
                newDueDate,
                renewalCount: updated.renewalCount
            }
        }).catch(e => console.error("Renewal receipt error:", e));

        return res.status(200).json({
            success: true,
            message: `Book loan renewed successfully by ${constants.renewalExtendsDays} days.`,
            issuedBook: updated
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to renew book.", error: error.message });
    }
};
