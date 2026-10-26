import prisma from "../config/db.js";
import { logAuditEvent } from "../services/auditService.js";

// Approved Academic Book Vendors
const APPROVED_SUPPLIERS = [
    { id: 1, name: "Oxford University Press India", email: "orders.in@oup.com", phone: "+91 120 4015000", rating: 4.8, leadTime: "3-5 days" },
    { id: 2, name: "Pearson Academic Education", email: "support@pearson.co.in", phone: "+91 120 4190100", rating: 4.9, leadTime: "2-4 days" },
    { id: 3, name: "McGraw-Hill Education India", email: "customersupport.india@mheducation.com", phone: "+91 11 43531000", rating: 4.7, leadTime: "4-6 days" },
    { id: 4, name: "Wiley India Pvt Ltd", email: "wileyindia@wiley.com", phone: "+91 11 43630000", rating: 4.6, leadTime: "3-5 days" },
    { id: 5, name: "Springer Nature Academic", email: "inquiries@springernature.com", phone: "+91 11 45755555", rating: 4.9, leadTime: "5-7 days" },
    { id: 6, name: "Cambridge University Press", email: "academic@cambridge.org", phone: "+91 11 43543500", rating: 4.8, leadTime: "4-6 days" }
];

// Department Academic Library Budgets (FY 2026-27)
const DEPARTMENT_BUDGETS = {
    "Computer Science & Engineering": { code: "BUD-CSE-26", totalBudget: 500000, allocated: 320000 },
    "Information Technology": { code: "BUD-IT-26", totalBudget: 400000, allocated: 210000 },
    "Mechanical Engineering": { code: "BUD-ME-26", totalBudget: 450000, allocated: 280000 },
    "Electrical & Electronics Engineering": { code: "BUD-EEE-26", totalBudget: 400000, allocated: 195000 },
    "Civil Engineering": { code: "BUD-CE-26", totalBudget: 350000, allocated: 160000 },
    "Management Studies": { code: "BUD-MBA-26", totalBudget: 300000, allocated: 140000 },
    "Applied Sciences": { code: "BUD-SCI-26", totalBudget: 250000, allocated: 110000 },
    "General": { code: "BUD-GEN-26", totalBudget: 300000, allocated: 125000 }
};

/**
 * @desc Get all procurement book acquisition requests
 * @route GET /api/procurement/requests
 */
export const getProcurementRequests = async (req, res) => {
    try {
        const { status, department } = req.query;
        const where = {};
        if (status && status !== "ALL") where.status = status;
        if (department && department !== "ALL") where.department = department;

        const requests = await prisma.procurementRequest.findMany({
            where,
            orderBy: { createdAt: "desc" }
        });

        return res.json({ success: true, count: requests.length, requests });
    } catch (err) {
        console.error("Error in getProcurementRequests:", err);
        return res.status(500).json({ success: false, message: "Could not retrieve procurement requests." });
    }
};

/**
 * @desc Submit a book acquisition purchase request (Students, Faculty, Staff)
 * @route POST /api/procurement/requests
 */
export const createProcurementRequest = async (req, res) => {
    try {
        const {
            title,
            author,
            isbn,
            publisher,
            estimatedPrice = 1200,
            department = "Computer Science & Engineering",
            notes = "",
            requestedBy = req.user?.email || "Student",
            requesterRole = req.user?.role || "STUDENT"
        } = req.body;

        if (!title || !author) {
            return res.status(400).json({ success: false, message: "Title and author are required." });
        }

        const request = await prisma.procurementRequest.create({
            data: {
                title,
                author,
                isbn: isbn || null,
                publisher: publisher || null,
                estimatedPrice: estimatedPrice ? Number(estimatedPrice) : null,
                department,
                requestedBy,
                requesterRole,
                status: "PENDING",
                notes: notes || null
            }
        });

        await logAuditEvent({
            action: "PROCUREMENT_REQUESTED",
            entityType: "PROCUREMENT",
            entityId: request.id,
            performedBy: requestedBy,
            details: `Book purchase request submitted: "${title}" by ${author} (${department}).`
        });

        return res.status(201).json({
            success: true,
            message: "Book procurement request submitted for librarian review.",
            request
        });
    } catch (err) {
        console.error("Error in createProcurementRequest:", err);
        return res.status(500).json({ success: false, message: "Could not submit procurement request." });
    }
};

/**
 * @desc Update procurement request status (Approve, Order, Receive, Reject)
 * @route PATCH /api/procurement/requests/:id
 */
export const updateProcurementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, supplier, budgetCode, notes, performedBy = "Librarian" } = req.body;

        const existing = await prisma.procurementRequest.findUnique({
            where: { id: Number(id) }
        });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Procurement request not found." });
        }

        const dataToUpdate = {};
        if (status) dataToUpdate.status = status;
        if (supplier) dataToUpdate.supplier = supplier;
        if (budgetCode) dataToUpdate.budgetCode = budgetCode;
        if (notes !== undefined) dataToUpdate.notes = notes;

        const updated = await prisma.procurementRequest.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });

        await logAuditEvent({
            action: `PROCUREMENT_${status || "UPDATED"}`,
            entityType: "PROCUREMENT",
            entityId: existing.id,
            performedBy,
            details: `Purchase request #${existing.id} "${existing.title}" status changed to ${status || existing.status}. Supplier: ${supplier || "N/A"}`
        });

        return res.json({
            success: true,
            message: `Procurement request #${id} updated to ${status}.`,
            request: updated
        });
    } catch (err) {
        console.error("Error in updateProcurementStatus:", err);
        return res.status(500).json({ success: false, message: "Could not update procurement request." });
    }
};

/**
 * @desc Get Departmental Library Budgets
 * @route GET /api/procurement/budgets
 */
export const getDepartmentBudgets = async (req, res) => {
    try {
        // Calculate additional spent amounts from approved/ordered requests
        const approvedRequests = await prisma.procurementRequest.findMany({
            where: { status: { in: ["APPROVED", "ORDERED", "RECEIVED"] } }
        });

        const budgets = Object.entries(DEPARTMENT_BUDGETS).map(([dept, b]) => {
            const extraSpent = approvedRequests
                .filter((r) => r.department === dept)
                .reduce((sum, r) => sum + (Number(r.estimatedPrice) || 0), 0);

            const totalSpent = b.allocated + extraSpent;
            const remaining = Math.max(0, b.totalBudget - totalSpent);

            return {
                department: dept,
                budgetCode: b.code,
                totalBudget: b.totalBudget,
                spent: totalSpent,
                remaining,
                utilization: ((totalSpent / b.totalBudget) * 100).toFixed(1) + "%"
            };
        });

        return res.json({ success: true, budgets });
    } catch (err) {
        console.error("Error in getDepartmentBudgets:", err);
        return res.status(500).json({ success: false, message: "Could not retrieve department budgets." });
    }
};

/**
 * @desc Get Approved Book Suppliers & Vendors
 * @route GET /api/procurement/suppliers
 */
export const getSuppliers = async (req, res) => {
    return res.json({ success: true, count: APPROVED_SUPPLIERS.length, suppliers: APPROVED_SUPPLIERS });
};
