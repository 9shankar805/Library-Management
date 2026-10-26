import express from "express";
import {
    getAuditLogs,
    recordAuditLog,
    getAuditActionsSummary
} from "../controllers/auditLogController.js";

const router = express.Router();

router.get("/", getAuditLogs);
router.post("/", recordAuditLog);
router.get("/actions-summary", getAuditActionsSummary);

export default router;
