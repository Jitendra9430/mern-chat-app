const Sidebar = ({ users = [], accessChat, onlineUsers = [], currentUserId }) => {
  return (
    <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto border-r">
      <h2 className="font-bold mb-4 text-lg">Chats</h2>

      {users.length === 0 ? (
        <div className="text-gray-500 text-sm">No users found</div>
      ) : (
        users.map((u) => {
          // ✅ Safety checks
          if (!u || !u._id) return null;

          const isOnline = onlineUsers.includes(u._id);

          // ✅ Prevent self-user rendering (extra safety)
          if (u._id === currentUserId) return null;

          return (
            <div
              key={u._id}
              onClick={() => {
                console.log("Clicked user:", u);
                console.log("Clicked ID:", u._id);

                // 🚫 Prevent invalid/self chat
                if (!u._id || u._id === currentUserId) {
                  console.log("❌ Invalid or self chat blocked");
                  return;
                }

                accessChat(u._id);
              }}
              className="p-3 mb-2 bg-white rounded-lg cursor-pointer hover:bg-gray-200 flex justify-between items-center shadow-sm transition"
            >
              {/* User Name */}
              <span className="font-medium">{u.name}</span>

              {/* Online Indicator */}
              {isOnline && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Sidebar;