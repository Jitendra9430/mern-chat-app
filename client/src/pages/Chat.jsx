import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import API from "../services/api";
import Sidebar from "../components/Sidebar";

const ENDPOINT = "http://localhost:5000";

const Chat = () => {
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ================= LOAD USER =================
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) navigate("/login");
    else setUser(storedUser);
  }, [navigate]);

  const actualUser = user?.user || user;

  // ================= SOCKET SETUP =================
  useEffect(() => {
    if (!actualUser) return;

    socketRef.current = io(ENDPOINT);
    socketRef.current.emit("setup", actualUser._id);

    socketRef.current.on("connected", () => {
      console.log("✅ Socket connected");
    });

    socketRef.current.on("online users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [actualUser]);

  // ================= JOIN CHAT + RECEIVE =================
  useEffect(() => {
    if (!selectedChat || !socketRef.current) return;

    socketRef.current.emit("join chat", selectedChat._id);
    socketRef.current.off("message received");

    socketRef.current.on("message received", (newMessage) => {
      console.log("📩 RECEIVED:", newMessage);

      const incomingChatId =
        typeof newMessage.chat === "object"
          ? newMessage.chat._id
          : newMessage.chat;

      // Use functional state read to get latest selectedChat._id
      setMessages((prev) => {
        // Guard: ignore if message belongs to a different chat
        if (incomingChatId !== selectedChat._id) return prev;
        // Guard: ignore duplicates
        if (prev.find((m) => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      socketRef.current?.off("message received");
    };
  }, [selectedChat]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ================= FETCH USERS =================
  useEffect(() => {
    if (!user) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const myId = storedUser.user?._id || storedUser._id;

    API.get("/users", {
      headers: { Authorization: `Bearer ${storedUser.token}` },
    }).then((res) => {
      setUsers(res.data.filter((u) => u._id !== myId));
    });
  }, [user]);

  // ================= ACCESS CHAT =================
  const accessChat = async (userId) => {
    if (!userId) return;

    // ✅ REMOVED the early-return guard that blocked reopening chats.
    // The backend /chat route must handle finding existing chats.

    const storedUser = JSON.parse(localStorage.getItem("user"));

    try {
      const { data } = await API.post(
        "/chat",
        { userId },
        {
          headers: {
            Authorization: `Bearer ${storedUser.token}`,
          },
        }
      );

      console.log("✅ CHAT OPENED:", data._id);

      setSelectedChat(data);
      setMessages([]);
    } catch (error) {
      console.log(
        "❌ ACCESS CHAT ERROR:",
        error.response?.data || error.message
      );
    }
  };

  // ================= FETCH MESSAGES =================
  useEffect(() => {
    if (!selectedChat) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));

    API.get(`/message/${selectedChat._id}`, {
      headers: { Authorization: `Bearer ${storedUser.token}` },
    }).then((res) => {
      setMessages(res.data);
    });
  }, [selectedChat]);

  // ================= SEND MESSAGE =================
  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const messageContent = input;
    setInput(""); // Clear input immediately for better UX

    try {
      const { data } = await API.post(
        "/message",
        {
          content: messageContent,
          chatId: selectedChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${storedUser.token}`,
          },
        }
      );

      console.log("📤 SENT:", data);

      socketRef.current.emit("new message", data);

      // ✅ Add to local messages so sender sees it immediately
      setMessages((prev) => {
        if (prev.find((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });
    } catch (err) {
      console.log("❌ SEND ERROR:", err.message);
      setInput(messageContent); // Restore input on error
    }
  };

  // ================= UI =================
  if (!actualUser) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      <Sidebar
        users={users}
        accessChat={accessChat}
        onlineUsers={onlineUsers}
        currentUserId={actualUser._id}
      />

      <div className="flex-1 flex flex-col bg-gray-100">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-300 font-bold">
              {selectedChat.users.find((u) => u._id !== actualUser._id)?.name}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId =
                    typeof msg.sender === "object"
                      ? msg.sender._id
                      : msg.sender;

                  const isMe =
                    senderId?.toString() === actualUser._id?.toString();

                  return (
                    <div
                      key={msg._id}
                      className={`mb-2 flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg max-w-xs break-words ${
                          isMe ? "bg-green-400 text-white" : "bg-white"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 flex bg-white border-t">
              <input
                className="flex-1 border p-2 rounded"
                value={input}
                placeholder="Type a message..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="ml-2 bg-blue-500 text-white px-4 rounded hover:bg-blue-600 transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;