import prisma from "../config/db.js";
import { dispatchNotification } from "../controllers/notificationController.js";

/**
 * 1. Process Due-Date Advance Reminders (Loans due in 1 to 3 days)
 */
export async function runDueRemindersJob() {
    const jobName = "DUE_DATE_REMINDERS";
    const startedAt = new Date();
    let processedCount = 0;
    let details = "";

    try {
        const now = new Date();
        const threeDaysAhead = new Date();
        threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

        // Find active loans due in next 3 days
        const upcomingDue = await prisma.issuedBook.findMany({
            where: {
                isReturned: false,
                dueDate: {
                    gte: now,
                    lte: threeDaysAhead
                }
            },
            include: {
                book: true,
                student: {
                    include: { user: true }
                }
            }
        });

        for (const loan of upcomingDue) {
            const daysLeft = Math.max(1, Math.ceil((new Date(loan.dueDate) - now) / (1000 * 60 * 60 * 24)));
            const studentEmail = loan.student?.user?.email || `${loan.studentId}@student.nitandhra.ac.in`;
            const studentName = loan.student?.user?.username || loan.student?.name || "Student";

            await dispatchNotification({
                userId: loan.studentId,
                userEmail: studentEmail,
                userName: studentName,
                rollNo: loan.studentId,
                type: "DUE_REMINDER",
                title: `Loan Due in ${daysLeft} Day(s)`,
                message: `Your borrowed copy of "${loan.book?.title}" is due on ${new Date(loan.dueDate).toLocaleDateString()}. Please return or renew on time.`,
                link: "/student/profile",
                metadata: {
                    bookTitle: loan.book?.title || "Book",
                    author: loan.book?.author || "Author",
                    dueDate: loan.dueDate,
                    daysLeft
                }
            });
            processedCount++;
        }

        details = `Successfully sent ${processedCount} due reminder notice(s).`;

        await prisma.backgroundJobLog.create({
            data: {
                jobName,
                status: "SUCCESS",
                details,
                processedCount,
                startedAt,
                completedAt: new Date()
            }
        });

        return { success: true, processedCount, details };
    } catch (err) {
        console.error(`Error in ${jobName} job:`, err);
        await prisma.backgroundJobLog.create({
            data: {
                jobName,
                status: "FAILED",
                details: `Error: ${err.message}`,
                processedCount,
                startedAt,
                completedAt: new Date()
            }
        });
        return { success: false, error: err.message };
    }
}

/**
 * 2. Process Overdue Loans & Accumulate Daily Fines
 */
export async function runOverdueFinesJob() {
    const jobName = "OVERDUE_FINES_PROCESSING";
    const startedAt = new Date();
    let processedCount = 0;
    let totalFineAssessed = 0;

    try {
        const now = new Date();
        const constants = await prisma.libraryConstants.findFirst() || { overdueFinePerDay: 5.00 };
        const dailyRate = Number(constants.overdueFinePerDay || 5.00);

        let fineType = await prisma.fineType.findFirst({ where: { type: "Overdue Return" } });
        if (!fineType) {
            fineType = await prisma.fineType.create({ data: { type: "Overdue Return" } });
        }

        // Find unreturned loans where dueDate < now
        const overdueLoans = await prisma.issuedBook.findMany({
            where: {
                isReturned: false,
                dueDate: { lt: now }
            },
            include: {
                book: true,
                student: { include: { user: true } },
                fines: { where: { isPaid: false } }
            }
        });

        for (const loan of overdueLoans) {
            const daysOverdue = Math.max(1, Math.ceil((now - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24)));
            const fineAmount = daysOverdue * dailyRate;
            totalFineAssessed += fineAmount;

            // Check if fine record already exists
            const existingFine = loan.fines && loan.fines[0];
            if (existingFine) {
                await prisma.fine.update({
                    where: { id: existingFine.id },
                    data: {
                        amount: fineAmount,
                        description: `Overdue by ${daysOverdue} day(s) @ ₹${dailyRate}/day.`
                    }
                });
            } else {
                await prisma.fine.create({
                    data: {
                        studentId: loan.studentId,
                        issuedBookId: loan.id,
                        fineTypeId: fineType.id,
                        amount: fineAmount,
                        description: `Overdue by ${daysOverdue} day(s) @ ₹${dailyRate}/day.`
                    }
                });
            }

            const studentEmail = loan.student?.user?.email || `${loan.studentId}@student.nitandhra.ac.in`;
            const studentName = loan.student?.user?.username || loan.student?.name || "Student";

            await dispatchNotification({
                userId: loan.studentId,
                userEmail: studentEmail,
                userName: studentName,
                rollNo: loan.studentId,
                type: "OVERDUE_ALERT",
                title: `⚠️ Overdue Alert: ${daysOverdue} Day(s) Late`,
                message: `"${loan.book?.title}" is overdue by ${daysOverdue} day(s). Current accumulated fine: ₹${fineAmount.toFixed(2)}. Please return immediately.`,
                link: "/student/profile",
                metadata: {
                    bookTitle: loan.book?.title || "Book",
                    author: loan.book?.author || "Author",
                    dueDate: loan.dueDate,
                    daysOverdue,
                    fineAmount
                }
            });
            processedCount++;
        }

        const details = `Processed ${processedCount} overdue book(s). Assessed ₹${totalFineAssessed.toFixed(2)} in fines.`;

        await prisma.backgroundJobLog.create({
            data: {
                jobName,
                status: "SUCCESS",
                details,
                processedCount,
                startedAt,
                completedAt: new Date()
            }
        });

        return { success: true, processedCount, totalFineAssessed, details };
    } catch (err) {
        console.error(`Error in ${jobName} job:`, err);
        await prisma.backgroundJobLog.create({
            data: {
                jobName,
                status: "FAILED",
                details: `Error: ${err.message}`,
                processedCount,
                startedAt,
                completedAt: new Date()
            }
        });
        return { success: false, error: err.message };
    }
}

/**
 * 3. Smart Reservation Expiry & Waitlist Promotion
 * Unclaimed hold tokens past deadline are expired, and next student in FIFO queue is promoted!
 */
export async function runReservationExpiryJob() {
    const jobName = "RESERVATION_EXPIRY_AND_WAITLIST";
    const startedAt = new Date();
    let expiredCount = 0;
    let promotedCount = 0;

    try {
        const now = new Date();
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        let reservedStatus = await prisma.status.findFirst({ where: { status: "Reserved" } });
        let expiredStatus = await prisma.status.findFirst({ where: { status: "Expired" } });
        if (!expiredStatus) {
            expiredStatus = await prisma.status.create({ data: { status: "Expired" } });
        }

        if (!reservedStatus) {
            return { success: true, expiredCount: 0, promotedCount: 0 };
        }

        // Find reservations that are expired (either past expiresAt or past 48h)
        const expiredReservations = await prisma.bookReservation.findMany({
            where: {
                statusId: reservedStatus.id,
                OR: [
                    { expiresAt: { lt: now } },
                    { expiresAt: null, reservedDate: { lt: fortyEightHoursAgo } }
                ]
            },
            include: {
                book: true,
                student: { include: { user: true } },
                copy: true
            }
        });

        for (const resv of expiredReservations) {
            // 1. Mark current reservation as Expired
            await prisma.bookReservation.update({
                where: { id: resv.id },
                data: { statusId: expiredStatus.id }
            });
            expiredCount++;

            // Notify expired student
            const studentEmail = resv.student?.user?.email || `${resv.studentId}@student.nitandhra.ac.in`;
            await dispatchNotification({
                userId: resv.studentId,
                userEmail: studentEmail,
                userName: resv.student?.user?.username || "Student",
                rollNo: resv.studentId,
                type: "GENERAL",
                title: "Reservation Pickup Window Expired",
                message: `Your pickup hold on "${resv.book?.title}" has expired as it was not collected within the 48-hour window.`,
                link: "/student/reservations"
            });

            // 2. Check for next student in FIFO queue for this book
            let waitlistedStatus = await prisma.status.findFirst({ where: { status: "Waitlisted" } });
            if (!waitlistedStatus) {
                waitlistedStatus = await prisma.status.create({ data: { status: "Waitlisted" } });
            }

            const nextInQueue = await prisma.bookReservation.findFirst({
                where: {
                    bookId: resv.bookId,
                    statusId: waitlistedStatus.id
                },
                orderBy: { queuePosition: "asc" },
                include: { student: { include: { user: true } } }
            });

            if (nextInQueue) {
                // Promote next student!
                const pickupDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
                await prisma.bookReservation.update({
                    where: { id: nextInQueue.id },
                    data: {
                        statusId: reservedStatus.id,
                        copyId: resv.copyId || undefined,
                        expiresAt: pickupDeadline
                    }
                });
                promotedCount++;

                const nextEmail = nextInQueue.student?.user?.email || `${nextInQueue.studentId}@student.nitandhra.ac.in`;
                await dispatchNotification({
                    userId: nextInQueue.studentId,
                    userEmail: nextEmail,
                    userName: nextInQueue.student?.user?.username || "Student",
                    rollNo: nextInQueue.studentId,
                    type: "RESERVATION_READY",
                    title: `🎉 Copy Available: "${resv.book?.title}"`,
                    message: `You have reached the front of the waitlist! Present Token #${nextInQueue.token} at the circulation desk within 48 hours.`,
                    link: "/student/reservations",
                    metadata: {
                        bookTitle: resv.book?.title || "Book",
                        token: nextInQueue.token,
                        pickupDeadline
                    }
                });
            } else {
                // No waitlist: return copy to available inventory
                if (resv.copyId) {
                    await prisma.bookCopy.update({
                        where: { id: resv.copyId },
                        data: { status: "AVAILABLE" }
                    });
                }
                if (resv.bookId) {
                    const avail = await prisma.bookAvailability.findFirst({ where: { bookId: resv.bookId } });
                    if (avail) {
                        await prisma.bookAvailability.update({
                            where: { id: avail.id },
                            data: { availableCopies: avail.availableCopies + 1 }
                        });
                    }
                }
            }
        }

        const details = `Expired ${expiredCount} reservation(s); promoted ${promotedCount} waitlisted student(s).`;

        await prisma.backgroundJobLog.create({
            data: {
                jobName,
                status: "SUCCESS",
                details,
                processedCount: expiredCount + promotedCount,
                startedAt,
                completedAt: new Date()
            }
        });

        return { success: true, expiredCount, promotedCount, details };
    } catch (err) {
        console.error(`Error in ${jobName} job:`, err);
        await prisma.backgroundJobLog.create({
            data: {
                jobName,
                status: "FAILED",
                details: `Error: ${err.message}`,
                processedCount: 0,
                startedAt,
                completedAt: new Date()
            }
        });
        return { success: false, error: err.message };
    }
}

/**
 * 4. Run All Background Tasks with Retry Handling
 */
export async function runAllJobs() {
    console.log("⏱️ [Cron Runner] Starting scheduled automated maintenance jobs...");
    const dueRes = await runDueRemindersJob();
    const overdueRes = await runOverdueFinesJob();
    const expiryRes = await runReservationExpiryJob();

    return {
        timestamp: new Date().toISOString(),
        dueReminders: dueRes,
        overdueFines: overdueRes,
        reservationExpiry: expiryRes
    };
}

/**
 * Background Scheduler initialization
 */
let schedulerInterval = null;
export function initBackgroundScheduler() {
    if (schedulerInterval) clearInterval(schedulerInterval);

    console.log("⏱️ [Scheduler] Automated background jobs initialized (Runs every 30 minutes).");
    // Run initial pass after 10 seconds of startup
    setTimeout(() => {
        runAllJobs().catch(e => console.error("Initial cron job error:", e));
    }, 10000);

    // Schedule regular 30-minute interval
    schedulerInterval = setInterval(() => {
        runAllJobs().catch(e => console.error("Scheduled cron error:", e));
    }, 30 * 60 * 1000);
}
