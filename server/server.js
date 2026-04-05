import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import http from "http";
import { Server } from "socket.io";

// ✅ Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import Message from "./models/messageModel.js";

dotenv.config();

// ✅ Connect DB
connectDB();

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Chat App Backend Running...");
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ================= ERRORS =================
app.use((req, res) => {
  res.status(404).json({ message: "❌ Route not found" });
});

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ================= SOCKET =================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ GLOBAL STATE
let onlineUsers = [];
let lastSeen = {};

io.on("connection", (socket) => {
  console.log(" User connected:", socket.id);

  // ✅ Setup user
  socket.on("setup", (userId) => {
    socket.userId = userId;
    socket.join(userId);

    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId);
    }

    io.emit("online users", onlineUsers);
    socket.emit("connected");
  });

  // ✅ Join chat
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log(" Joined chat:", chatId);
  });

  // ================= MESSAGE FLOW =================

  // ✅ New Message
  socket.on("new message", (newMessage) => {
    const chat = newMessage.chat;

    if (!chat.users) return;

    chat.users.forEach((user) => {
      // ❌ don't send to sender
      if (user._id === newMessage.sender._id) return;

      // 📩 send message
      socket.to(user._id).emit("message received", newMessage);

      // ✅ delivered ack to sender
      socket
        .to(newMessage.sender._id)
        .emit("message delivered", newMessage._id);
    });
  });

  // ✅ Seen messages
  socket.on("message seen", async (chatId) => {
    try {
      const messages = await Message.find({ chat: chatId });

      messages.forEach((msg) => {
        socket
          .to(msg.sender.toString())
          .emit("message seen", msg._id);
      });
    } catch (error) {
      console.log("Seen error:", error.message);
    }
  });

  // ================= TYPING =================

  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });

  socket.on("stop typing", (chatId) => {
    socket.to(chatId).emit("stop typing");
  });

  // ================= DISCONNECT =================

  socket.on("disconnect", () => {
    console.log(" User disconnected:", socket.id);

    if (socket.userId) {
      onlineUsers = onlineUsers.filter((id) => id !== socket.userId);
      lastSeen[socket.userId] = new Date();

      io.emit("online users", onlineUsers);
      io.emit("last seen", lastSeen);
    }
  });
});

// ================= START =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});