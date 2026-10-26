import prisma from "../config/db.js";

/**
 * @desc Get all shelves with floor, rack coordinates, and physical copy counts
 * @route GET /api/shelves
 */
export const getShelves = async (req, res) => {
    try {
        const shelves = await prisma.shelf.findMany({
            include: {
                availabilities: {
                    include: { book: { select: { id: true, title: true, isbn: true } } }
                },
                copies: {
                    select: { id: true, accessionNo: true, barcode: true, rfidTag: true, status: true, condition: true }
                }
            },
            orderBy: [{ floor: "asc" }, { section: "asc" }, { rackNumber: "asc" }]
        });

        const formatted = shelves.map(s => ({
            id: s.id,
            building: s.building,
            floor: s.floor,
            section: s.section,
            rackNumber: s.rackNumber,
            shelfTier: s.shelfTier,
            coordinates: { x: s.coordinatesX, y: s.coordinatesY },
            totalCopiesCount: s.copies.length,
            availableCopiesCount: s.copies.filter(c => c.status === "AVAILABLE").length,
            books: s.availabilities.map(a => a.book).filter(Boolean)
        }));

        return res.status(200).json({ success: true, count: formatted.length, shelves: formatted });
    } catch (error) {
        console.error("Error fetching shelves:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch shelves.", error: error.message });
    }
};

/**
 * @desc Get visual floor map with all shelf coordinates
 * @route GET /api/shelves/map
 */
export const getShelfMap = async (req, res) => {
    try {
        const shelves = await prisma.shelf.findMany({
            include: {
                copies: {
                    select: { id: true, status: true }
                },
                availabilities: {
                    include: { book: { select: { id: true, title: true, author: true } } }
                }
            },
            orderBy: [{ floor: "asc" }, { section: "asc" }, { rackNumber: "asc" }]
        });

        const floors = {};
        for (const s of shelves) {
            const floorKey = `Floor ${s.floor}`;
            if (!floors[floorKey]) {
                floors[floorKey] = {
                    floorNumber: s.floor,
                    building: s.building,
                    shelves: []
                };
            }

            floors[floorKey].shelves.push({
                id: s.id,
                section: s.section,
                rackNumber: s.rackNumber,
                shelfTier: s.shelfTier,
                coordinatesX: s.coordinatesX,
                coordinatesY: s.coordinatesY,
                totalCopies: s.copies.length,
                availableCopies: s.copies.filter(c => c.status === "AVAILABLE").length,
                titlesStored: s.availabilities.map(a => a.book?.title).filter(Boolean)
            });
        }

        return res.status(200).json({
            success: true,
            building: "Central Library",
            totalFloors: Object.keys(floors).length,
            floors
        });
    } catch (error) {
        console.error("Error building shelf map:", error);
        return res.status(500).json({ success: false, message: "Failed to generate shelf map.", error: error.message });
    }
};

export const getShelfById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const shelf = await prisma.shelf.findUnique({
            where: { id },
            include: {
                availabilities: {
                    include: { book: true }
                },
                copies: {
                    include: { book: { select: { id: true, title: true, author: true, isbn: true } } }
                }
            }
        });
        if (!shelf) {
            return res.status(404).json({ success: false, message: "Shelf not found." });
        }
        return res.status(200).json({ success: true, shelf });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch shelf.", error: error.message });
    }
};

export const createShelf = async (req, res) => {
    try {
        const { building, floor, section, rackNumber, shelfTier, coordinatesX, coordinatesY } = req.body;
        if (!section || !rackNumber) {
            return res.status(400).json({ success: false, message: "Section and rack number are required." });
        }
        const shelf = await prisma.shelf.create({
            data: {
                building: building || "Central Library",
                floor: floor ? parseInt(floor, 10) : 1,
                section,
                rackNumber,
                shelfTier: shelfTier || "Tier 1",
                coordinatesX: coordinatesX ? parseInt(coordinatesX, 10) : null,
                coordinatesY: coordinatesY ? parseInt(coordinatesY, 10) : null
            }
        });
        return res.status(201).json({ success: true, message: "Shelf created successfully.", shelf });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to create shelf.", error: error.message });
    }
};

export const updateShelf = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { building, floor, section, rackNumber, shelfTier, coordinatesX, coordinatesY } = req.body;
        const shelf = await prisma.shelf.update({
            where: { id },
            data: {
                ...(building && { building }),
                ...(floor !== undefined && { floor: parseInt(floor, 10) }),
                ...(section && { section }),
                ...(rackNumber && { rackNumber }),
                ...(shelfTier && { shelfTier }),
                ...(coordinatesX !== undefined && { coordinatesX: parseInt(coordinatesX, 10) }),
                ...(coordinatesY !== undefined && { coordinatesY: parseInt(coordinatesY, 10) })
            }
        });
        return res.status(200).json({ success: true, message: "Shelf updated.", shelf });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update shelf.", error: error.message });
    }
};

export const deleteShelf = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await prisma.shelf.delete({ where: { id } });
        return res.status(200).json({ success: true, message: "Shelf deleted." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete shelf.", error: error.message });
    }
};
