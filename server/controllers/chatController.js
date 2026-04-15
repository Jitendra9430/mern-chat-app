import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import mongoose from "mongoose";

export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId not sent" });
  }

  try {
    const currentUserId = req.user._id;

    // ❌ prevent self chat
    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    // ✅ Convert both to ObjectId explicitly
    const uid1 = new mongoose.Types.ObjectId(currentUserId);
    const uid2 = new mongoose.Types.ObjectId(userId);

    let chat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: uid1 } } },
        { users: { $elemMatch: { $eq: uid2 } } },
        { users: { $size: 2 } },
      ],
    })
      .populate("users", "-password")
      .populate("lastMessage")

    if (chat) {
      console.log("✅ EXISTING CHAT FOUND:", chat._id);
      return res.status(200).json(chat);
    }

    // 🆕 No existing chat — create a new one
    console.log("🆕 CREATING NEW CHAT");

    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [currentUserId, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "users",
      "-password",
    );

    console.log("✅ NEW CHAT CREATED:", fullChat._id);

    return res.status(201).json(fullChat);
  } catch (error) {
    console.log("❌ ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};
