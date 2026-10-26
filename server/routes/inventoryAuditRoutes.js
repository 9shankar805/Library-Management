import express from "express";
import {
    getAuditSessions,
    createAuditSession,
    getAuditSessionById,
    scanAuditCopy,
    reconcileAuditSession,
    markCopyLost,
    writeOffCopy
} from "../controllers/inventoryAuditController.js";

const router = express.Router();

router.get("/sessions", getAuditSessions);
router.post("/sessions", createAuditSession);
router.get("/sessions/:id", getAuditSessionById);
router.post("/sessions/:id/scan", scanAuditCopy);
router.post("/sessions/:id/reconcile", reconcileAuditSession);
router.post("/copies/:id/mark-lost", markCopyLost);
router.post("/copies/:id/write-off", writeOffCopy);

export default router;
