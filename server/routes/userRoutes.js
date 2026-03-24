 import express from "express";
import { getUsers, loginUser } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginUser); // ✅ ADD THIS
router.get("/", protect, getUsers);

export default router;