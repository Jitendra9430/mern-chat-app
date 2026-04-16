 import express from "express";
import {
  sendMessage,
  getMessages,
  deleteMessage,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/:messageId/delete", protect, deleteMessage);

export default router;