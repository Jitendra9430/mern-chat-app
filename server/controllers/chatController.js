 const Chat = require("../models/Chat");

// Create or access chat
const accessChat = async (req, res) => {
  const { userId } = req.body;

  // Check for invalid userID
  const mongoose = require("mongoose");
  if(!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({message:"Invalid user ID"});
  }

  // Prevent from chat with yourself
  if(req.user._id.toString() === userId) 
  {
    return res.status(400).json({ message: "You cannot chat with yourself"});
  }

  try {
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] },
    }).populate("participants", "-password");

    if (chat) {
      return res.json(chat);
    }

    chat = await Chat.create({
      participants: [req.user._id, userId],
    });

    chat = await chat.populate("participants", "-password");

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { accessChat };