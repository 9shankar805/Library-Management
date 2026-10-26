import prisma from "../config/db.js";

/**
 * @desc Get personalized book recommendations for a student
 * @route GET /api/books/recommendations
 */
export const getPersonalizedRecommendations = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?.rollNo || req.query.studentId || "21CS001";

        // 1. Fetch student profile and department
        const student = await prisma.student.findUnique({
            where: { rollNo: String(studentId) },
            include: { user: true }
        });

        // 2. Fetch student's past borrowing history and active loans
        const [pastLoans, activeLoans] = await Promise.all([
            prisma.borrowHistory.findMany({
                where: { studentId: String(studentId) },
                include: { book: { include: { category: true, department: true } } }
            }),
            prisma.issuedBook.findMany({
                where: { studentId: String(studentId) },
                include: { book: { include: { category: true, department: true } } }
            })
        ]);

        const borrowedBookIds = new Set();
        const categoryFreq = {};
        const authorFreq = {};

        [...pastLoans, ...activeLoans].forEach((loan) => {
            if (loan.book) {
                borrowedBookIds.add(loan.book.id);
                if (loan.book.categoryId) {
                    categoryFreq[loan.book.categoryId] = (categoryFreq[loan.book.categoryId] || 0) + 1;
                }
                if (loan.book.author) {
                    authorFreq[loan.book.author] = (authorFreq[loan.book.author] || 0) + 1;
                }
            }
        });

        // Sort favorite categories and authors
        const topCategoryIds = Object.keys(categoryFreq)
            .map(Number)
            .sort((a, b) => categoryFreq[b] - categoryFreq[a]);
        const topAuthors = Object.keys(authorFreq)
            .sort((a, b) => authorFreq[b] - authorFreq[a]);

        const recommendations = [];
        const seenBookIds = new Set(borrowedBookIds);

        // A. Content-Based: Books in student's favorite categories
        if (topCategoryIds.length > 0) {
            const categoryBooks = await prisma.book.findMany({
                where: {
                    categoryId: { in: topCategoryIds },
                    id: { notIn: Array.from(seenBookIds) }
                },
                take: 6,
                include: {
                    category: true,
                    department: true,
                    availabilities: { include: { shelf: true } }
                }
            });

            categoryBooks.forEach((b) => {
                seenBookIds.add(b.id);
                recommendations.push({
                    ...b,
                    score: 95,
                    reason: `Because you enjoy reading ${b.category?.name || "this category"}`,
                    badge: "Personal Interest"
                });
            });
        }

        // B. Department Peers' Popular Titles
        if (student?.department) {
            const deptBooks = await prisma.book.findMany({
                where: {
                    department: { name: { contains: student.department.split(" ")[0], mode: "insensitive" } },
                    id: { notIn: Array.from(seenBookIds) }
                },
                take: 6,
                include: {
                    category: true,
                    department: true,
                    availabilities: { include: { shelf: true } }
                }
            });

            deptBooks.forEach((b) => {
                seenBookIds.add(b.id);
                recommendations.push({
                    ...b,
                    score: 85,
                    reason: `Popular among ${student.department} students`,
                    badge: "Major Trend"
                });
            });
        }

        // C. Fallback: Top Available & High-Stock Library Classics
        if (recommendations.length < 8) {
            const fallbackBooks = await prisma.book.findMany({
                where: {
                    id: { notIn: Array.from(seenBookIds) }
                },
                take: 10,
                orderBy: { id: "asc" },
                include: {
                    category: true,
                    department: true,
                    availabilities: { include: { shelf: true } }
                }
            });

            fallbackBooks.forEach((b) => {
                if (!seenBookIds.has(b.id)) {
                    seenBookIds.add(b.id);
                    recommendations.push({
                        ...b,
                        score: 75,
                        reason: "Essential Central Library Curated Collection",
                        badge: "Curated Pick"
                    });
                }
            });
        }

        // Normalize available copies count on each recommendation
        const enriched = recommendations.slice(0, 10).map((b) => {
            const avail = b.availabilities?.[0];
            return {
                id: b.id,
                title: b.title,
                author: b.author,
                isbn: b.isbn,
                categoryName: b.category?.name || "General",
                departmentName: b.department?.name || "All Departments",
                availableCopies: avail?.availableCopies || 0,
                shelfLocation: avail?.shelf
                    ? `Floor ${avail.shelf.floor} · ${avail.shelf.section} (${avail.shelf.rackNumber})`
                    : "Stack Area",
                shelf: avail?.shelf || null,
                score: b.score,
                reason: b.reason,
                badge: b.badge
            };
        });

        return res.json({
            success: true,
            studentId,
            studentName: student?.user?.username || "Student",
            department: student?.department || "General",
            totalRecommendations: enriched.length,
            recommendations: enriched
        });
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return res.status(500).json({ success: false, message: "Could not generate recommendations." });
    }
};
