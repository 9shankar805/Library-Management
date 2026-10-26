import express from "express";
import { scanRfid, bulkAuditShelf } from "../controllers/rfidController.js";

const router = express.Router();

router.get("/scan", scanRfid);
router.post("/scan", scanRfid);
router.post("/bulk-audit", bulkAuditShelf);

export default router;
