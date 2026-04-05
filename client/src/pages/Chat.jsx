import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import API from "../services/api";
import Sidebar from "../components/Sidebar";

const ENDPOINT = "http://localhost:5000";

const Chat = () => {
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(false);

  // ✅ Load user
  useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user")); // ✅ FIXED

  console.log("Stored user:", storedUser);

  if (!storedUser) {
    navigate("/login");
  } else {
    setUser(storedUser);
  }
}, [navigate]);

  // ✅ DEFINE actualUser BEFORE USING
  const actualUser = user?.user || user;

  // ✅ Socket setup
  useEffect(() => {
    if (!actualUser) return;

    socketRef.current = io(ENDPOINT);
    const socket = socketRef.current;

    socket.emit("setup", actualUser._id); // ✅ FIXED

    socket.on("online users", setOnlineUsers);
    socket.on("typing", () => setTypingUsers(true));
    socket.on("stop typing", () => setTypingUsers(false));

    socket.on("message received", (newMessage) => {
      if (!selectedChat || selectedChat._id !== newMessage.chat._id) return;

      setMessages((prev) => [
        ...prev,
        { ...newMessage, status: newMessage.status || "sent" },
      ]);
    });

    socket.on("message delivered", (messageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg
        )
      );
    });

    socket.on("message seen", () => {
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          status: "seen",
        }))
      );
    });

    return () => socket.disconnect();
  }, [actualUser, selectedChat]);

  // ✅ Fetch users
  useEffect(() => {
  if (!user) return;

  const storedUser = JSON.parse(localStorage.getItem("user"));

  API.get("/users", {
    headers: {
      Authorization: `Bearer ${storedUser.token}`,
    },
  }).then((res) => setUsers(res.data));
}, [user]);

  // ✅ Access chat
  const accessChat = async (userId) => {
    const { data } = await API.post("/chat", { userId });
    setSelectedChat(data);
    setMessages([]);
  };

  // ✅ Fetch messages
  useEffect(() => {
    if (!selectedChat) return;

    API.get(`/message/${selectedChat._id}`).then((res) => {
      setMessages(
        res.data.map((msg) => ({
          ...msg,
          status: msg.status || "sent",
        }))
      );

      socketRef.current.emit("join chat", selectedChat._id);
    });
  }, [selectedChat]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;

    const { data } = await API.post("/message", {
      content: input,
      chatId: selectedChat._id,
    });

    socketRef.current.emit("new message", data);

    setMessages((prev) => [...prev, data]);
    setInput("");
  };

  // ✅ Get sender name
  const getSenderName = (chat) => {
    return chat.users.find((u) => u._id !== actualUser._id)?.name;
  };

  // ✅ Loading check
  if (!actualUser) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        users={users}
        accessChat={accessChat}
        onlineUsers={onlineUsers}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 bg-gray-300">
              <div className="font-bold">{getSenderName(selectedChat)}</div>
              <div className="text-sm text-gray-600">
                {typingUsers && "Typing..."}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => {
                const senderId =
                  typeof msg.sender === "object"
                    ? msg.sender._id
                    : msg.sender;

                const isMe = senderId === actualUser._id;

                return (
                  <div
                    key={msg._id}
                    className={`mb-2 flex ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg max-w-xs ${
                        isMe
                          ? "bg-green-400 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      <div>{msg.content}</div>

                      <div className="text-xs text-right mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-4 flex">
              <input
                className="flex-1 border p-2 rounded"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);

                  socketRef.current.emit("typing", selectedChat._id);

                  setTimeout(() => {
                    socketRef.current.emit(
                      "stop typing",
                      selectedChat._id
                    );
                  }, 1000);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                className="ml-2 bg-blue-500 text-white px-4 rounded"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            Select a chat
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;