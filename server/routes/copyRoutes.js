import express from "express";
import {
    getBookCopies,
    lookupCopy,
    addBookCopies,
    updateCopyStatus,
    deleteCopy
} from "../controllers/copyController.js";

const router = express.Router();

router.get("/lookup", lookupCopy);
router.get("/book/:id", getBookCopies);
router.post("/book/:id", addBookCopies);
router.patch("/:id", updateCopyStatus);
router.delete("/:id", deleteCopy);

export default router;
