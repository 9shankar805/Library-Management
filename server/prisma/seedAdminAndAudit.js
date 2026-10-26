import prisma from "../config/db.js";

async function main() {
    console.log("🌱 Seeding Administration, Procurement, and Audit Data...");

    // 1. Initial Procurement Requests
    const existingProc = await prisma.procurementRequest.count();
    if (existingProc === 0) {
        await prisma.procurementRequest.createMany({
            data: [
                {
                    title: "Cloud Native Patterns: Designing change-tolerant software",
                    author: "Cornelia Davis",
                    isbn: "9781617294297",
                    publisher: "Manning",
                    estimatedPrice: 3200.00,
                    department: "Computer Science & Engineering",
                    requestedBy: "21CS001",
                    requesterRole: "STUDENT",
                    status: "PENDING",
                    notes: "Recommended for Cloud Computing and Distributed Systems elective (CS402)."
                },
                {
                    title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow (3rd Ed)",
                    author: "Aurélien Géron",
                    isbn: "9781098125974",
                    publisher: "O'Reilly Media",
                    estimatedPrice: 4100.00,
                    department: "Computer Science & Engineering",
                    requestedBy: "librarian@library.edu",
                    requesterRole: "LIBRARIAN",
                    status: "APPROVED",
                    supplier: "Pearson Academic Education",
                    budgetCode: "BUD-CSE-26",
                    notes: "Core reference textbook requested by CSE Department curriculum committee."
                },
                {
                    title: "Mechatronics: Electronic Control Systems in Mechanical and Electrical Engineering",
                    author: "W. Bolton",
                    isbn: "9781292250977",
                    publisher: "Pearson Education",
                    estimatedPrice: 2800.00,
                    department: "Mechanical Engineering",
                    requestedBy: "21ME045",
                    requesterRole: "STUDENT",
                    status: "ORDERED",
                    supplier: "Oxford University Press India",
                    budgetCode: "BUD-ME-26",
                    notes: "Needed for Robotics Lab & Mechatronics project semester."
                },
                {
                    title: "Modern Electric, Hybrid Electric, and Fuel Cell Vehicles",
                    author: "Mehrdad Ehsani",
                    isbn: "9781498761772",
                    publisher: "CRC Press",
                    estimatedPrice: 5600.00,
                    department: "Electrical & Electronics Engineering",
                    requestedBy: "21EE012",
                    requesterRole: "STUDENT",
                    status: "RECEIVED",
                    supplier: "Wiley India Pvt Ltd",
                    budgetCode: "BUD-EEE-26",
                    notes: "Received and accessioned into Section C, Rack C1."
                }
            ]
        });
        console.log("✅ Seeded procurement requests.");
    }

    // 2. Initial Inventory Audit Session
    const existingAudit = await prisma.inventoryAuditSession.count();
    if (existingAudit === 0) {
        const totalCopies = await prisma.bookCopy.count();
        await prisma.inventoryAuditSession.create({
            data: {
                sessionName: "Fall 2026 Comprehensive Physical Stack Verification",
                conductedBy: "Chief Librarian & Stack Assistants",
                status: "IN_PROGRESS",
                totalExpected: totalCopies,
                totalScanned: 24,
                totalMissing: 0,
                totalMisplaced: 1
            }
        });
        console.log("✅ Seeded initial inventory audit session.");
    }

    // 3. Initial Audit Logs
    const existingLogs = await prisma.auditLog.count();
    if (existingLogs === 0) {
        await prisma.auditLog.createMany({
            data: [
                {
                    action: "SYSTEM_INITIALIZATION",
                    entityType: "SYSTEM",
                    entityId: "SYS-001",
                    performedBy: "ADMIN",
                    details: "Central Library Management System initialized with PostgreSQL 17 cluster.",
                    ipAddress: "127.0.0.1"
                },
                {
                    action: "BOOK_COPIES_ACCESSIONED",
                    entityType: "BOOK_COPY",
                    entityId: "ACC-BATCH-01",
                    performedBy: "librarian@library.edu",
                    details: "Accessioned individual physical copies with Code-128 barcodes and UHF Gen2 RFID tags.",
                    ipAddress: "192.168.1.10"
                },
                {
                    action: "SHELF_BLUEPRINT_CONFIGURED",
                    entityType: "SHELF_NAVIGATION",
                    entityId: "MAP-FLOOR-1-3",
                    performedBy: "librarian@library.edu",
                    details: "Configured 3 floors and 10 racks (A1-G1) with 2D coordinate blueprint wayfinding.",
                    ipAddress: "192.168.1.10"
                },
                {
                    action: "DIGITAL_REPOSITORY_SEEDED",
                    entityType: "DIGITAL_RESOURCE",
                    entityId: "DIG-10",
                    performedBy: "librarian@library.edu",
                    details: "Seeded 10 open-access textbooks, theses, and research papers.",
                    ipAddress: "192.168.1.10"
                }
            ]
        });
        console.log("✅ Seeded initial immutable audit trail logs.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
