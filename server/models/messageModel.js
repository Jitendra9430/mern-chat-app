import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },

    content: {
      type: String,
    },
    image: {
      type: String,
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    seenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },

    reactions: [
      {
        user: {type:mongoose.Schema.Types.ObjectId, ref: "User"},
        emoji: String,
      },
    ],

  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;