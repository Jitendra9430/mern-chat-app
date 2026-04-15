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

dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Chat App Backend Running...");
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ================= ERRORS =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
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

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("⚡ New socket connected:", socket.id);

  // ================= SETUP =================
  socket.on("setup", (userId) => {
    if (!userId) return;

    socket.userId = userId;
    socket.join(userId); // personal room (for online status etc.)

    console.log("✅ User joined personal room:", userId);

    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId);
    }

    io.emit("online users", onlineUsers);
    socket.emit("connected");
  });

  // ================= JOIN CHAT =================
  socket.on("join chat", (chatId) => {
    if (!chatId) return;

    socket.join(chatId.toString());
    console.log("💬 Joined chat room:", chatId);
  });

  // ================= NEW MESSAGE =================
  socket.on("new message", (newMessage) => {
    try {
      const chat = newMessage.chat;

      if (!chat || !chat._id) {
        console.log("❌ Invalid message: missing chat or chat._id");
        return;
      }

      console.log("📤 NEW MESSAGE:", newMessage.content);

      // ✅ FIX: Emit to the CHAT ROOM, not to personal user rooms.
      // socket.to(...) excludes the sender automatically.
      socket.to(chat._id.toString()).emit("message received", newMessage);

      console.log("📩 Emitted to chat room:", chat._id);
    } catch (err) {
      console.log("❌ SOCKET ERROR:", err.message);
    }
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
  socket.on("message seen", async (chatId) => {
    try {
      const messages = await Message.find({ chat: chatId });

      messages.forEach((msg) => {
        socket.to(msg.sender.toString()).emit("message seen", msg._id);
      });

      console.log("👀 Seen updated for chat:", chatId);
    } catch (error) {
      console.log("Seen error:", error.message);
    }
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    if (socket.userId) {
      onlineUsers = onlineUsers.filter((id) => id !== socket.userId);
      io.emit("online users", onlineUsers);
    }
  });
});

// ================= START =================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});