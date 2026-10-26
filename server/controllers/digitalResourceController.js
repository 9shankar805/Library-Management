import prisma from "../config/db.js";

/**
 * @desc Get all digital library resources with optional filtering by type, department, and search
 * @route GET /api/digital-resources
 */
export const getDigitalResources = async (req, res) => {
    try {
        const { type, department, search, limit = 50 } = req.query;
        const whereClause = {};

        if (type && type !== "ALL") {
            whereClause.type = String(type).toUpperCase();
        }

        if (department && department !== "ALL") {
            whereClause.department = { contains: String(department), mode: "insensitive" };
        }

        if (search && search.trim()) {
            const cleanSearch = search.trim();
            whereClause.OR = [
                { title: { contains: cleanSearch, mode: "insensitive" } },
                { author: { contains: cleanSearch, mode: "insensitive" } },
                { description: { contains: cleanSearch, mode: "insensitive" } }
            ];
        }

        const resources = await prisma.digitalResource.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: parseInt(limit, 10) || 50
        });

        const totalCounts = await prisma.digitalResource.groupBy({
            by: ["type"],
            _count: { id: true }
        });

        const countsByType = {
            ALL: resources.length,
            EBOOK: 0,
            NOTES: 0,
            THESIS: 0,
            RESEARCH_PAPER: 0
        };

        totalCounts.forEach((c) => {
            countsByType[c.type] = c._count.id;
        });

        return res.json({
            success: true,
            total: resources.length,
            countsByType,
            resources
        });
    } catch (error) {
        console.error("Error fetching digital resources:", error);
        return res.status(500).json({ success: false, message: "Could not fetch digital library resources." });
    }
};

/**
 * @desc Add a new digital resource (e-book, lecture notes, student thesis, research paper)
 * @route POST /api/digital-resources
 */
export const addDigitalResource = async (req, res) => {
    try {
        const {
            title,
            author,
            description,
            type,
            fileUrl,
            fileSize,
            department,
            accessRole = "ALL",
            uploadedBy = "Librarian Staff"
        } = req.body;

        if (!title || !fileUrl || !type) {
            return res.status(400).json({
                success: false,
                message: "Title, file URL/path, and resource type are required."
            });
        }

        const validTypes = ["EBOOK", "NOTES", "THESIS", "RESEARCH_PAPER"];
        const cleanType = String(type).toUpperCase();
        if (!validTypes.includes(cleanType)) {
            return res.status(400).json({
                success: false,
                message: `Type must be one of: ${validTypes.join(", ")}`
            });
        }

        const newResource = await prisma.digitalResource.create({
            data: {
                title: title.trim(),
                author: author ? author.trim() : "Faculty / Author",
                description: description ? description.trim() : null,
                type: cleanType,
                fileUrl: fileUrl.trim(),
                fileSize: fileSize ? fileSize.trim() : "2.4 MB",
                department: department ? department.trim() : "General",
                accessRole,
                uploadedBy
            }
        });

        return res.status(201).json({
            success: true,
            message: "Digital resource uploaded to central digital repository.",
            resource: newResource
        });
    } catch (error) {
        console.error("Error creating digital resource:", error);
        return res.status(500).json({ success: false, message: "Could not add digital resource." });
    }
};

/**
 * @desc Delete a digital resource
 * @route DELETE /api/digital-resources/:id
 */
export const deleteDigitalResource = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.digitalResource.delete({ where: { id } });
        return res.json({ success: true, message: "Digital resource removed." });
    } catch (error) {
        console.error("Error deleting digital resource:", error);
        return res.status(500).json({ success: false, message: "Failed to remove digital resource." });
    }
};
