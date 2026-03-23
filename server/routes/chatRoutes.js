 import express from "express";
import { accessChat } from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, accessChat);

export default router;