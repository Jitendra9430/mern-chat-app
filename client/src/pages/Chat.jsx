import { useEffect, useState } from "react";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:5000";

let socket;

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const chatId = "chat123";

  // ✅ Different user per tab
  const user = {
    _id: window.location.hash === "#2" ? "456" : "123",
  };

  useEffect(() => {
    socket = io(ENDPOINT);

    // ✅ Setup user room
    socket.emit("setup", user._id);

    // ✅ Join chat room
    socket.emit("join chat", chatId);

    // ✅ Listen for messages
    socket.on("message received", (newMessage) => {
      console.log("Received:", newMessage);

      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessages = () => {
  if (!input.trim()) return;

  const messageData = {
    content: input,
    sender: user,
    chat: {
      _id: chatId,
      users: [{ _id: "123" }, { _id: "456" }],
    },
  };

  socket.emit("new message", messageData);
  setInput("");
};
  return (
    <div>
      <h2>Chat App (User: {user._id})</h2>

      <div style={{ border: "1px solid gray", padding: "10px", height: "200px", overflowY: "auto" }}>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender._id}:</strong> {msg.content}
          </p>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message"
      />

      <button onClick={sendMessages}>Send</button>
    </div>
  );
};

export default Chat;