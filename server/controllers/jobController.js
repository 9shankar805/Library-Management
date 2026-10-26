import prisma from "../config/db.js";
import {
    runDueRemindersJob,
    runOverdueFinesJob,
    runReservationExpiryJob,
    runAllJobs
} from "../services/cronService.js";

/**
 * @desc Get background job execution logs
 * @route GET /api/jobs
 */
export const getJobLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const logs = await prisma.backgroundJobLog.findMany({
            orderBy: { startedAt: "desc" },
            take: limit
        });

        return res.json({
            success: true,
            total: logs.length,
            logs
        });
    } catch (error) {
        console.error("Error fetching job logs:", error);
        return res.status(500).json({ success: false, message: "Could not fetch job execution history." });
    }
};

/**
 * @desc Manually trigger background jobs
 * @route POST /api/jobs/run
 */
export const triggerJob = async (req, res) => {
    try {
        const { job } = req.body || req.query;

        let result;
        if (job === "due_reminders") {
            result = await runDueRemindersJob();
        } else if (job === "overdue_fines") {
            result = await runOverdueFinesJob();
        } else if (job === "reservation_expiry") {
            result = await runReservationExpiryJob();
        } else {
            result = await runAllJobs();
        }

        return res.json({
            success: true,
            job: job || "all",
            result
        });
    } catch (error) {
        console.error("Error triggering background job:", error);
        return res.status(500).json({ success: false, message: "Failed to execute background job.", error: error.message });
    }
};
