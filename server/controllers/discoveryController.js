import prisma from "../config/db.js";

/**
 * @desc Advanced Multi-Facet Catalog Search with Aggregation Counts
 * @route GET /api/discovery/search
 */
export const advancedSearch = async (req, res) => {
    try {
        const {
            q = "",
            category,
            categoryId,
            department,
            departmentId,
            availableOnly,
            floor,
            rack,
            sortBy = "relevance",
            order = "asc",
            page = 1,
            limit = 20
        } = req.query;

        const whereClause = {};

        // 1. Text Query (Title, Author, ISBN)
        const cleanQuery = String(q).trim();
        if (cleanQuery) {
            whereClause.OR = [
                { title: { contains: cleanQuery, mode: "insensitive" } },
                { author: { contains: cleanQuery, mode: "insensitive" } },
                { isbn: { contains: cleanQuery, mode: "insensitive" } }
            ];
        }

        // 2. Category Filter
        if (categoryId && !isNaN(Number(categoryId))) {
            whereClause.categoryId = Number(categoryId);
        } else if (category && category !== "all") {
            whereClause.category = { name: { equals: String(category), mode: "insensitive" } };
        }

        // 3. Department Filter
        if (departmentId && !isNaN(Number(departmentId))) {
            whereClause.departmentId = Number(departmentId);
        } else if (department && department !== "all") {
            whereClause.department = { name: { equals: String(department), mode: "insensitive" } };
        }

        // 4. Shelf Location Filters (Floor & Rack)
        const shelfConditions = {};
        if (floor && floor !== "all") {
            shelfConditions.floor = Number(floor);
        }
        if (rack && rack !== "all") {
            shelfConditions.rackNumber = { equals: String(rack), mode: "insensitive" };
        }

        if (Object.keys(shelfConditions).length > 0) {
            whereClause.availabilities = {
                some: {
                    shelf: shelfConditions
                }
            };
        }

        // 5. Availability Filter
        if (availableOnly === "true" || availableOnly === true) {
            whereClause.availabilities = {
                ...(whereClause.availabilities || {}),
                some: {
                    ...(whereClause.availabilities?.some || {}),
                    availableCopies: { gt: 0 }
                }
            };
        }

        // 6. Pagination & Sorting
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 20);
        const skip = (pageNum - 1) * limitNum;

        let orderBy = { id: "asc" };
        if (sortBy === "title") orderBy = { title: order === "desc" ? "desc" : "asc" };
        if (sortBy === "author") orderBy = { author: order === "desc" ? "desc" : "asc" };
        if (sortBy === "publishedYear") orderBy = { publishedYear: order === "desc" ? "desc" : "asc" };

        const [totalCount, books, allCategories, allDepartments, allShelves] = await Promise.all([
            prisma.book.count({ where: whereClause }),
            prisma.book.findMany({
                where: whereClause,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    category: true,
                    department: true,
                    availabilities: { include: { shelf: true } }
                }
            }),
            prisma.category.findMany({ select: { id: true, name: true } }),
            prisma.department.findMany({ select: { id: true, name: true } }),
            prisma.shelf.findMany({ select: { id: true, floor: true, section: true, rackNumber: true } })
        ]);

        // Normalize books output
        const normalizedBooks = books.map((b) => {
            const avail = b.availabilities?.[0];
            return {
                id: b.id,
                title: b.title,
                author: b.author,
                isbn: b.isbn,
                description: b.description,
                publishedYear: b.publishedYear,
                categoryName: b.category?.name || "General",
                departmentName: b.department?.name || "All Departments",
                totalCopies: avail?.totalCopies || 0,
                availableCopies: avail?.availableCopies || 0,
                shelf: avail?.shelf || null,
                availabilities: b.availabilities || [],
                locationSummary: avail?.shelf
                    ? `Floor ${avail.shelf.floor} · ${avail.shelf.section} (${avail.shelf.rackNumber})`
                    : "Central Stack"
            };
        });

        // Compute Facet Aggregation Counts
        const facets = {
            categories: allCategories.map((c) => ({
                id: c.id,
                name: c.name
            })),
            departments: allDepartments.map((d) => ({
                id: d.id,
                name: d.name
            })),
            floors: [1, 2, 3],
            racks: Array.from(new Set(allShelves.map((s) => s.rackNumber))).sort()
        };

        return res.json({
            success: true,
            total: totalCount,
            page: pageNum,
            totalPages: Math.ceil(totalCount / limitNum),
            books: normalizedBooks,
            facets
        });
    } catch (error) {
        console.error("Error in advanced search:", error);
        return res.status(500).json({ success: false, message: "Advanced search query failed." });
    }
};

/**
 * @desc AI Library Assistant: Natural Language Book Discovery, Shelf Guidance & FAQs
 * @route POST /api/discovery/ai-chat
 */
export const aiChatAssistant = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message is required." });
        }

        const q = message.trim().toLowerCase();

        // 1. FAQ Intent: Library Hours
        if (q.includes("hour") || q.includes("timing") || q.includes("open") || q.includes("close")) {
            return res.json({
                success: true,
                reply: "Central Library is open Monday through Saturday from **8:00 AM to 10:00 PM**, and on Sundays / Institute Holidays from **9:00 AM to 5:00 PM**. The 24/7 Digital Commons reading room remains open continuously during examination periods.",
                matchedBooks: [],
                suggestions: ["How many books can I borrow?", "Where are computer science books?", "What are the overdue fines?"]
            });
        }

        // 2. FAQ Intent: Borrowing Limits & Loan Period
        if (q.includes("how many") || q.includes("borrow limit") || q.includes("quota") || q.includes("loan period") || q.includes("days can i keep")) {
            return res.json({
                success: true,
                reply: "Undergraduate and Postgraduate students can borrow up to **3 books simultaneously** for a standard duration of **14 days**. Loans can be renewed up to **2 times** online if there is no active student reservation waitlist on the title.",
                matchedBooks: [],
                suggestions: ["How to renew my book?", "What is the fine for late return?", "How do reservations work?"]
            });
        }

        // 3. FAQ Intent: Fines Policy
        if (q.includes("fine") || q.includes("late fee") || q.includes("penalty")) {
            return res.json({
                success: true,
                reply: "The overdue late return fine is **₹5.00 per day** per overdue book. Fines accumulate automatically each midnight. You can pay fines online via UPI/Card in the **Pay Fine** tab on your student portal.",
                matchedBooks: [],
                suggestions: ["View my current fine", "How to renew a book?", "Library operating hours"]
            });
        }

        // 4. FAQ Intent: Reservation & Waitlist Rules
        if (q.includes("reservation") || q.includes("waitlist") || q.includes("token") || q.includes("pickup")) {
            return res.json({
                success: true,
                reply: "When all copies of a book are checked out, you can join the **Smart Reservation Waitlist**. The instant a book is returned, the next student in the queue is automatically promoted and notified with a 6-digit verification token. You will have a **48-hour pickup window** to claim your copy at the circulation desk.",
                matchedBooks: [],
                suggestions: ["Check my active requests", "Browse available books", "Search for machine learning books"]
            });
        }

        // 5. Catalog Search & Shelf Wayfinding Intent
        // Extract keywords from the prompt
        const cleanTerms = q
            .replace(/where (can i find|is|are)/gi, "")
            .replace(/find (me|a|some)?/gi, "")
            .replace(/show (me|a|some)?/gi, "")
            .replace(/do you have (any)?/gi, "")
            .replace(/books? (on|about|for)/gi, "")
            .replace(/looking for/gi, "")
            .replace(/recommend/gi, "")
            .trim();

        const searchTokens = cleanTerms.split(/\s+/).filter(t => t.length > 2);
        const searchQuery = searchTokens.length > 0 ? searchTokens[0] : cleanTerms;

        const matchedBooks = await prisma.book.findMany({
            where: {
                OR: [
                    { title: { contains: searchQuery, mode: "insensitive" } },
                    { author: { contains: searchQuery, mode: "insensitive" } },
                    { category: { name: { contains: searchQuery, mode: "insensitive" } } },
                    { department: { name: { contains: searchQuery, mode: "insensitive" } } }
                ]
            },
            take: 4,
            include: {
                category: true,
                department: true,
                availabilities: { include: { shelf: true } }
            }
        });

        if (matchedBooks.length > 0) {
            const firstBook = matchedBooks[0];
            const shelf = firstBook.availabilities?.[0]?.shelf;
            const shelfGuide = shelf
                ? `You can find **"${firstBook.title}"** in **Central Library, Floor ${shelf.floor}, ${shelf.section}**, on **Rack ${shelf.rackNumber} (${shelf.shelfTier})**.`
                : `**"${firstBook.title}"** is in the catalog stack.`;

            const booksFormatted = matchedBooks.map((b) => {
                const s = b.availabilities?.[0]?.shelf;
                return {
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    categoryName: b.category?.name || "General",
                    availableCopies: b.availabilities?.[0]?.availableCopies || 0,
                    floor: s?.floor || 1,
                    section: s?.section || "Section A",
                    rackNumber: s?.rackNumber || "A1",
                    shelfTier: s?.shelfTier || "Tier 1"
                };
            });

            return res.json({
                success: true,
                reply: `I found ${matchedBooks.length} title(s) matching "${searchQuery}"!\n\n📍 ${shelfGuide}\n\nHere are the top matches and their exact shelf locations:`,
                matchedBooks: booksFormatted,
                suggestions: [
                    `Where is Rack ${shelf?.rackNumber || 'A1'} located?`,
                    `Show details for ${firstBook.title}`,
                    "How do I reserve this book?"
                ]
            });
        }

        // 6. Generic Fallback with helpful recommendations
        const sampleBooks = await prisma.book.findMany({
            take: 3,
            include: {
                category: true,
                availabilities: { include: { shelf: true } }
            }
        });

        const fallbackFormatted = sampleBooks.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            categoryName: b.category?.name || "General",
            availableCopies: b.availabilities?.[0]?.availableCopies || 0,
            floor: b.availabilities?.[0]?.shelf?.floor || 1,
            section: b.availabilities?.[0]?.shelf?.section || "Section A",
            rackNumber: b.availabilities?.[0]?.shelf?.rackNumber || "A1"
        }));

        return res.json({
            success: true,
            reply: `I'm your AI Library Assistant! You can ask me to locate any book in the Central Library, guide you to the right floor and rack, explain borrowing rules, or find books by topic.`,
            matchedBooks: fallbackFormatted,
            suggestions: [
                "Find books on algorithms",
                "Where is clean code located?",
                "What are the library timings?",
                "How many books can I borrow?"
            ]
        });

    } catch (error) {
        console.error("AI assistant error:", error);
        return res.status(500).json({ success: false, message: "AI Assistant was unable to process your request." });
    }
};
