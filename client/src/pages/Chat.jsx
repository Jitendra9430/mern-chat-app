import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import API from "../services/api";

import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";

const ENDPOINT = "http://localhost:5000";

const Chat = () => {
  const socketRef = useRef(null);

  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ✅ FIX 1: correct key
  const user = JSON.parse(localStorage.getItem("user"));


  useEffect(() => {
  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  if (!user) {
    console.log("User not found in localStorage");
    navigate("/login");
  } else {
    console.log("User found:", user);
  }
}, []);

  // 🔌 Socket setup
  useEffect(() => {
    if (!user) {
      console.error("User not found in localStorage");
      return;
    }

    socketRef.current = io(ENDPOINT);

    socketRef.current.emit("setup", user._id);

    return () => {
      socketRef.current.disconnect();
    };
  }, [user]);

  // 👥 Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!user) return;

        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await API.get("/user", config);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [user]);

  // 💬 Create / access chat
  const accessChat = async (userId) => {
    try {
      if (!user) return;

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await API.post(
        "/chat",
        { userId },
        config
      );

      setSelectedChat(data);
      setMessages([]);

      if (socketRef.current) {
        socketRef.current.emit("join chat", data._id);
      }
    } catch (error) {
      console.error("Error accessing chat:", error);
    }
  };

  // 📩 Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !user) return;

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await API.get(
          `/message/${selectedChat._id}`,
          config
        );

        setMessages(data);
        console.log("Users:", data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedChat, user]);

  // 📤 Send message
  const sendMessage = async () => {
    if (!input || !selectedChat || !user) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await API.post(
        "/message",
        {
          content: input,
          chatId: selectedChat._id,
        },
        config
      );

      socketRef.current.emit("new message", data);

      setMessages((prev) => [...prev, data]);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // 📥 Receive message (real-time)
  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    socket.on("message received", (newMessage) => {
      if (
        !selectedChat ||
        selectedChat._id !== newMessage.chat._id
      )
        return;

      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("message received");
    };
  }, [selectedChat]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar users={users} accessChat={accessChat} />

      <ChatBox
        selectedChat={selectedChat}
        messages={messages}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
      />
    </div>
  );
};

export default Chat;