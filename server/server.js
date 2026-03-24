 import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Chat App Backend Running");
});

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ Socket Logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 SETUP (VERY IMPORTANT)
  socket.on("setup", (userId) => {
    socket.join(userId);
    console.log("User joined personal room:", userId);

    // ✅ notify frontend
    socket.emit("connected");
  });

  // ✅ Join chat room
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log("User joined chat:", chatId);
  });

  // ✅ Handle new message
  socket.on("new message", (message) => {
    const chat = message.chat;

    if (!chat.users) {
      console.log("Chat users not found");
      return;
    }

    console.log("Message received:", message.content);

    chat.users.forEach((user) => {
      // ❌ Don't send to sender
      if (user._id.toString() === message.sender._id.toString()) return;

      // ✅ Send to user's personal room
      io.emit("message received", message);
    });
  });

  // ✅ Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});