import express from "express";
import { advancedSearch, aiChatAssistant } from "../controllers/discoveryController.js";
import { getPersonalizedRecommendations } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/search", advancedSearch);
router.get("/recommendations", getPersonalizedRecommendations);
router.post("/ai-chat", aiChatAssistant);

export default router;
