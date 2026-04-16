  import { useState } from "react";

const Sidebar = ({
  users = [],
  accessChat,
  onlineUsers = [],
  currentUserId,
  collapsed = false,
  selectedChatId,
  darkMode,
  toggleSidebar,
}) => {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) =>
    u?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ================= COLLAPSED =================
  if (collapsed) {
    return (
      <div
        className={`flex flex-col items-center py-4 space-y-4 h-full border-r
        ${darkMode ? "bg-[#111b21] border-[#222]" : "bg-white border-gray-200"}`}
      >
        {filteredUsers.map((u) => {
          if (!u || u._id === currentUserId) return null;

          const isOnline = onlineUsers.includes(u._id);

          return (
            <div
              key={u._id}
              onClick={() => accessChat(u._id)}
              className="relative cursor-pointer hover:scale-105 transition"
            >
              <img
                src={u.pic || "/default-avatar.png"}
                onError={(e) => (e.target.src = "/default-avatar.png")}
                className="w-10 h-10 rounded-full object-cover"
              />

              {isOnline && (
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full
                  ${darkMode ? "border-[#111b21]" : "border-white"}`}
                ></span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ================= FULL =================
  return (
    <div
      className={`w-full h-full flex flex-col border-r
      ${darkMode
        ? "bg-[#111b21] text-white border-[#222]"
        : "bg-white text-black border-gray-200"}`}
    >
      {/* HEADER */}
      <div className="p-3 text-lg font-semibold">Chats</div>

      {/* SEARCH */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search or start new chat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full px-3 py-2 rounded text-sm outline-none
            ${
              darkMode
                ? "bg-[#202c33] text-white placeholder-gray-400"
                : "bg-gray-100 text-black placeholder-gray-500"
            }`}
        />
      </div>

      {/* USERS */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredUsers.length === 0 ? (
          <div className="text-gray-400 text-sm p-3">No users found</div>
        ) : (
          filteredUsers.map((u) => {
            if (!u || u._id === currentUserId) return null;

            const isOnline = onlineUsers.includes(u._id);
            const isActive = selectedChatId === u._id;

            return (
              <div
                key={u._id}
                onClick={() => accessChat(u._id)}
                className={`flex items-center gap-3 p-2 mb-1 rounded-lg cursor-pointer transition
                ${
                  isActive
                    ? darkMode
                      ? "bg-[#2a3942]"
                      : "bg-gray-200"
                    : darkMode
                    ? "hover:bg-[#202c33]"
                    : "hover:bg-gray-100"
                }`}
              >
                {/* AVATAR */}
                <div className="relative">
                  <img
                    src={u.pic || "/default-avatar.png"}
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  {isOnline && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full
                      ${darkMode ? "border-[#111b21]" : "border-white"}`}
                    ></span>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{u.name}</span>

                    <span className="text-[10px] text-gray-400">
                      {u.lastMessage?.createdAt
                        ? new Date(
                            u.lastMessage.createdAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 truncate">
                    {u.lastMessage?.content || "Start chatting..."}
                  </div>
                </div>

                {/* UNREAD */}
                {u.unreadCount > 0 && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {u.unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;