import { useEffect, useRef } from "react";

const ChatBox = ({
  messages,
  input,
  setInput,
  sendMessage,
  user,
  selectedChat,
  socketRef,
}) => {
  const bottomRef = useRef();

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-[70%] flex flex-col">
      {/* HEADER */}
      <div className="p-4 bg-white border-b font-semibold">
        {selectedChat
          ? selectedChat.participants.find((p) => p._id !== user._id)?.name
          : "Select a chat"}
      </div>

      {/* EMPTY STATE */}
      {!selectedChat ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          Select a user to start chatting
        </div>
      ) : (
        <>
          {/* MESSAGES */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg) => {
              const isMe = msg.sender._id === user._id;
              {
                typing && (
                  <div
                    className={`px-4 py-2 m-1 rounded-xl max-w-xs shadow ${
                      isMe ? "bg-green-500 text-white" : "bg-white border"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>

                    <div className="flex justify-end items-center gap-1">
                      {/* time */}
                      <span className="text-[10px] opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>

                      {/* ✅ TICKS */}
                      {isMe && (
                        <span className="text-xs">
                          {msg.status === "sent" && "✓"}
                          {msg.status === "delivered" && "✓✓"}
                          {msg.status === "seen" && (
                            <span className="text-blue-600">✓✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 m-1 rounded-xl max-w-xs shadow ${
                      isMe ? "bg-green-500 text-white" : "bg-white border"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>

                    {/* timestamp */}
                    <span className="text-[10px] block text-right opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* 👇 REQUIRED FOR AUTO SCROLL */}
            <div ref={bottomRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3 bg-white flex gap-2">
            <input
              disabled={!selectedChat}
              className="flex-1 border p-2 rounded disabled:bg-gray-200"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button
              onClick={sendMessage}
              className="bg-green-500 text-white px-4 rounded"
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBox;
