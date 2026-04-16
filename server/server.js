import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import http from "http";
import { Server } from "socket.io";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import Message from "./models/messageModel.js";
import User from "./models/userModel.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Chat App Backend Running...");
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ERRORS
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// SERVER
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// SOCKET
const io = new Server(server, {
  cors: { origin: "*" },
});

let onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);

  // ================= SETUP =================
  socket.on("setup", (userId) => {
    if (!userId) return;

    socket.userId = userId;
    socket.join(userId.toString());

    onlineUsers.add(userId.toString());

    io.emit("online users", Array.from(onlineUsers));
    socket.emit("connected");

    console.log("✅ Setup:", userId);
  });

  // ================= JOIN CHAT =================
  socket.on("join chat", (chatId) => {
    if (!chatId) return;

    socket.join(chatId.toString());
    console.log("📦 Joined chat:", chatId);
  });

  // ================= LEAVE CHAT (NEW) =================
  socket.on("leave chat", (chatId) => {
    if (!chatId) return;

    socket.leave(chatId.toString());
    console.log("🚪 Left chat:", chatId);
  });

  // ================= NEW MESSAGE =================
  socket.on("new message", (newMessage, callback) => {
    try {
      const chat = newMessage?.chat;

      if (!chat || !chat._id) {
        console.log("❌ Invalid message payload");
        return;
      }

      socket
        .to(chat._id.toString())
        .emit("message received", newMessage);

      // ✅ ACK (delivery confirmation)
      if (callback) callback({ status: "delivered" });

    } catch (err) {
      console.log("❌ Message error:", err.message);
    }
  });

  // ================= DELETE MESSAGE =================
  socket.on("delete message", ({ messageId, chatId }) => {
    if (!messageId || !chatId) return;

    socket
      .to(chatId.toString())
      .emit("message deleted", { messageId });

    console.log("🗑 Message deleted:", messageId);
  });

  // ================= TYPING =================
  socket.on("typing", (chatId) => {
    if (!chatId) return;

    socket.to(chatId.toString()).emit("typing");
  });

  socket.on("stop typing", (chatId) => {
    if (!chatId) return;

    socket.to(chatId.toString()).emit("stop typing");
  });

  // ================= SEEN =================
  socket.on("message seen", async ({ chatId, userId }) => {
    try {
      if (!chatId || !userId) return;

      await Message.updateMany(
        {
          chat: chatId,
          seenBy: { $ne: userId },
        },
        {
          $addToSet: { seenBy: userId },
        }
      );

      socket
        .to(chatId.toString())
        .emit("message seen", { chatId, userId });

      console.log("👀 Seen:", chatId);
    } catch (err) {
      console.log("Seen error:", err.message);
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", async () => {
    console.log("❌ Disconnected:", socket.id);

    try {
      if (socket.userId) {
        onlineUsers.delete(socket.userId.toString());

        await User.findByIdAndUpdate(socket.userId, {
          lastSeen: new Date(),
        });

        io.emit("online users", Array.from(onlineUsers));
      }
    } catch (err) {
      console.log("Disconnect error:", err.message);
    }
  });
});

// START
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});