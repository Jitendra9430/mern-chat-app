const Message = require("../models/messageModel");
const Chat = require("../models/Chat");

//SEND MESSAGE
exports.sendMessage = async (req, res) => {
    const {content, chatId} = req.body;

    try {
        let message = await Message.create({
            sender: req.user._id,
            content,
            chat: chatId,
        });

        message = await message.populate("sender", "name email");
        message = await message.populate("chat");

        await Chat.findByIdAndUpdate(chatId, {
            lastMesssage: message._id,
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

//GET MESSAGES
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({chat: req.params.chatId})
        .populate("sender", "name email")

        res.json(messages);
    } catch (error) {
        res.status(500).json({message: error.message});

    }
}