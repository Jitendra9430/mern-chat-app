 import Chat from "../models/chatModel.js";
import mongoose from "mongoose";

// Create or access chat
export const accessChat = async (req, res) => {
  const { userId } = req.body;

  // Check for invalid userID
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  // Prevent chat with yourself
  if (req.user._id.toString() === userId) {
    return res.status(400).json({
      message: "You cannot chat with yourself",
    });
  }

  try {
    let chat = await Chat.findOne({
      users: { $all: [req.user._id, userId] },
    }).populate("users", "-password");

    if (chat) {
      return res.json(chat);
    }

    chat = await Chat.create({
      users: [req.user._id, userId],
    });

    chat = await chat.populate("users", "-password");

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};