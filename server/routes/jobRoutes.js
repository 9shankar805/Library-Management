import express from "express";
import { getJobLogs, triggerJob } from "../controllers/jobController.js";

const router = express.Router();

router.get("/", getJobLogs);
router.post("/run", triggerJob);

export default router;
