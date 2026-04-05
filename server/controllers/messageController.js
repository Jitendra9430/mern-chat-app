import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  try {
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
      status: "sent",
    });

    message = await message.populate("sender", "name email");

    message = await message.populate({
      path: "chat",
      populate: {
        path: "users",
        select: "name email",
      },
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MESSAGES
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};