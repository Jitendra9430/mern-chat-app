import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";

// ================= SEND MESSAGE =================
export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  try {
    if (!content || !chatId) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // ✅ create message
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      status: "sent",
    });

    // ✅ populate sender
    message = await message.populate("sender", "_id name email");

    // ✅ populate chat + users
    message = await message.populate({
      path: "chat",
      populate: {
        path: "users",
        select: "_id name email",
      },
    });

    // ✅ update last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    console.log("✅ MESSAGE SAVED:", message._id);

    res.status(201).json(message);
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ================= GET MESSAGES =================
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      chat: req.params.chatId,
    })
      .populate("sender", "_id name email")
      .populate({
        path: "chat",
        populate: {
          path: "users",
          select: "_id name email",
        },
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};