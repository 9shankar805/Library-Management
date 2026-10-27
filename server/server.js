import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import shelfRoutes from "./routes/shelfRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import circulationRoutes from "./routes/circulationRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import fineRoutes from "./routes/fineRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import constantRoutes from "./routes/constantRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import copyRoutes from "./routes/copyRoutes.js";
import rfidRoutes from "./routes/rfidRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import discoveryRoutes from "./routes/discoveryRoutes.js";
import digitalResourceRoutes from "./routes/digitalResourceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import inventoryAuditRoutes from "./routes/inventoryAuditRoutes.js";
import procurementRoutes from "./routes/procurementRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import { initBackgroundScheduler } from "./services/cronService.js";
import { processExpiredReservations } from "./controllers/reservationController.js";
import { helmetMiddleware, authLimiter, apiLimiter, sanitizeInputs, errorHandler } from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../client/dist");

const app = express();

// Trust reverse proxy (essential for Render load balancers and rate limiting)
app.set("trust proxy", 1);

// Security Hardening: Helmet Headers & Input Sanitization
app.use(helmetMiddleware);
app.use(cors());
app.use(express.json());
app.use(sanitizeInputs);

// API Health Check (used by Render health check monitoring)
app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, message: "Server is running securely" });
});

// Root API welcome endpoint (fallback if frontend is not served by Express)
app.get("/", (req, res, next) => {
    if (fs.existsSync(clientDistPath)) {
        return next();
    }
    res.status(200).json({
        success: true,
        message: "Library Management System API is live and operational",
        health: "/api/health"
    });
});

// Rate Limiters
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// Resource-Oriented API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/digital-resources", digitalResourceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/inventory-audit", inventoryAuditRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/copies", copyRoutes);
app.use("/api/rfid", rfidRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/shelves", shelfRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/issued-books", circulationRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/constants", constantRoutes);
app.use("/api/profile", profileRoutes);

// Endpoint to download the generated Test Report Word Document
app.get("/api/test-report/download", (req, res) => {
    const reportPath = path.resolve("./API_Test_Report_Auth_and_Books.docx");
    res.download(reportPath, "API_Test_Report_Auth_and_Books.docx", (err) => {
        if (err) {
            res.status(404).json({ message: "Test report document not found. Run 'npm run test:report' first." });
        }
    });
});

// Serve static frontend assets if client build exists (unified fullstack deployment)
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api")) {
            return res.sendFile(path.join(clientDistPath, "index.html"));
        }
        next();
    });
}

// Centralized Error Handler (suppresses stack traces in production)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);

            // Initialize automated scheduled background jobs
            initBackgroundScheduler();
        });
    } catch (err) {
        console.error("❌ Server failed to start");
        console.error(err);
    }
}

startServer();
