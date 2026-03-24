const ChatBox = ({ messages, input, setInput, sendMessage }) => {
  return (
    <div style={{ width: "70%", padding: "10px" }}>
      <h3>Chat</h3>

      {/* MESSAGE AREA */}
      <div style={{ minHeight: "300px" }}>
        {messages.map((msg) => (
          <p key={msg._id}>
            <b>{msg.sender.name}:</b> {msg.content}
          </p>
        ))}
      </div>

      {/* INPUT */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message"
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatBox;