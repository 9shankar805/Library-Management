import express from "express";
import {
    getDigitalResources,
    addDigitalResource,
    deleteDigitalResource
} from "../controllers/digitalResourceController.js";

const router = express.Router();

router.get("/", getDigitalResources);
router.post("/", addDigitalResource);
router.delete("/:id", deleteDigitalResource);

export default router;
