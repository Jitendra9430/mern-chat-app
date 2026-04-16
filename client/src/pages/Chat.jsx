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

  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ================= THEME =================
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ================= AUTH =================
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) navigate("/login");
    else setUser(storedUser);
  }, [navigate]);

  const actualUser = user?.user || user;

  // ================= SOCKET =================
  useEffect(() => {
    if (!actualUser) return;

    socketRef.current = io(ENDPOINT);
    socketRef.current.emit("setup", actualUser._id);

    socketRef.current.on("online users", setOnlineUsers);

    return () => socketRef.current?.disconnect();
  }, [actualUser]);

  // ================= JOIN CHAT =================
  useEffect(() => {
    if (!selectedChat || !socketRef.current) return;

    socketRef.current.emit("join chat", selectedChat._id);

    // MESSAGE RECEIVED
    socketRef.current.on("message received", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      // REAL-TIME SIDEBAR
      setUsers((prevUsers) => {
        const sender =
          typeof newMessage.sender === "object"
            ? newMessage.sender
            : null;

        if (!sender) return prevUsers;

        let updatedUsers = [...prevUsers];

        const index = updatedUsers.findIndex(
          (u) => u._id === sender._id
        );

        if (index !== -1) {
          const user = updatedUsers[index];

          updatedUsers[index] = {
            ...user,
            lastMessage: newMessage,
            unreadCount: (user.unreadCount || 0) + 1,
          };

          const updatedUser = updatedUsers.splice(index, 1)[0];
          updatedUsers.unshift(updatedUser);
        }

        return updatedUsers;
      });
    });

    // TYPING
    socketRef.current.on("typing", () => setIsTyping(true));
    socketRef.current.on("stop typing", () => setIsTyping(false));

    // SEEN
    socketRef.current.on("message seen", ({ chatId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat === chatId
            ? {
                ...msg,
                seenBy: [...(msg.seenBy || []), userId],
              }
            : msg
        )
      );
    });

    return () => {
      socketRef.current.off("message received");
      socketRef.current.off("typing");
      socketRef.current.off("stop typing");
      socketRef.current.off("message seen");
    };
  }, [selectedChat]);

  // ================= SEEN EMIT =================
  useEffect(() => {
    if (!selectedChat || !socketRef.current) return;

    socketRef.current.emit("message seen", {
      chatId: selectedChat._id,
      userId: actualUser?._id,
    });
  }, [messages, selectedChat, actualUser]);

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
    const storedUser = JSON.parse(localStorage.getItem("user"));

    const { data } = await API.post(
      "/chat",
      { userId },
      { headers: { Authorization: `Bearer ${storedUser.token}` } }
    );

    setSelectedChat(data);
    setMessages([]);

    // RESET UNREAD
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, unreadCount: 0 } : u
      )
    );
  };

  // ================= FETCH MESSAGES =================
  useEffect(() => {
    if (!selectedChat) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));

    API.get(`/message/${selectedChat._id}`, {
      headers: { Authorization: `Bearer ${storedUser.token}` },
    }).then((res) => setMessages(res.data));
  }, [selectedChat]);

  // ================= SEND MESSAGE =================
  const sendMessage = async () => {
    if (!input.trim()) return;

    const storedUser = JSON.parse(localStorage.getItem("user"));

    const { data } = await API.post(
      "/message",
      { content: input, chatId: selectedChat._id },
      { headers: { Authorization: `Bearer ${storedUser.token}` } }
    );

    socketRef.current.emit("new message", data);
    setMessages((prev) => [...prev, data]);

    setInput("");
  };

  if (!actualUser) return <div>Loading...</div>;

  const otherUser = selectedChat?.users?.find(
    (u) => u._id !== actualUser._id
  );

  return (
    <div className={`flex h-screen ${darkMode ? "bg-[#0b141a]" : "bg-[#f0f2f5]"}`}>
      
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? "w-72" : "w-16"} transition-all`}>
        <Sidebar
          users={users}
          accessChat={accessChat}
          onlineUsers={onlineUsers}
          currentUserId={actualUser._id}
          collapsed={!sidebarOpen}
          selectedChatId={selectedChat?._id}
          darkMode={darkMode}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        {selectedChat && (
          <div className={`p-4 border-b flex justify-between items-center ${
            darkMode ? "bg-[#202c33]" : "bg-white"
          }`}>
            <span className="font-semibold">
              {selectedChat.isGroupChat
                ? selectedChat.chatName
                : otherUser?.name}
            </span>

            <button onClick={() => setDarkMode(!darkMode)}>🌙</button>
          </div>
        )}

        {/* TYPING */}
        {isTyping && (
          <div className="px-4 py-1 text-sm text-gray-400">
            typing...
          </div>
        )}

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => {
            const senderId =
              typeof msg.sender === "object"
                ? msg.sender._id
                : msg.sender;

            const isMe = senderId === actualUser._id;

            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : ""}`}>
                <div
                  className={`px-3 py-2 rounded-xl max-w-xs ${
                    isMe
                      ? "bg-[#005c4b] text-white"
                      : darkMode
                      ? "bg-[#202c33] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {msg.content}

                  <div className="flex items-center justify-end gap-1 text-[10px] mt-1 opacity-70">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {isMe && (
                      <span className="text-xs">
                        {msg.seenBy?.length > 1 ? (
                          <span className="text-blue-400">✔✔</span>
                        ) : msg.seenBy?.length === 1 ? (
                          "✔✔"
                        ) : (
                          "✔"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        {selectedChat && (
          <div className={`p-3 flex items-center gap-2 ${
            darkMode ? "bg-[#202c33]" : "bg-gray-100"
          }`}>
            <input
              className="flex-1 px-4 py-2 rounded-full outline-none"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);

                if (!typing) {
                  setTyping(true);
                  socketRef.current.emit("typing", selectedChat._id);
                }

                setTimeout(() => {
                  setTyping(false);
                  socketRef.current.emit("stop typing", selectedChat._id);
                }, 2000);
              }}
              placeholder="Type a message"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              className="bg-green-500 text-white p-2 rounded-full"
            >
              ➤
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;