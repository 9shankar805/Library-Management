import express from "express";
import {
    getCirculationTrends,
    getPopularBooks,
    getDepartmentUsage,
    getFinesSummary,
    exportReportCSV
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/circulation-trends", getCirculationTrends);
router.get("/popular-books", getPopularBooks);
router.get("/department-usage", getDepartmentUsage);
router.get("/fines-summary", getFinesSummary);
router.get("/export-csv", exportReportCSV);

export default router;
