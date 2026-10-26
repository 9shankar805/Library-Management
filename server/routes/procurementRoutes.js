import express from "express";
import {
    getProcurementRequests,
    createProcurementRequest,
    updateProcurementStatus,
    getDepartmentBudgets,
    getSuppliers
} from "../controllers/procurementController.js";

const router = express.Router();

router.get("/requests", getProcurementRequests);
router.post("/requests", createProcurementRequest);
router.patch("/requests/:id", updateProcurementStatus);
router.get("/budgets", getDepartmentBudgets);
router.get("/suppliers", getSuppliers);

export default router;
