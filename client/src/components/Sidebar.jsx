const Sidebar = ({ users, accessChat, onlineUsers }) => {
  return (
    <div className="w-1/4 bg-gray-200 p-4 overflow-y-auto">
      <h2 className="font-bold mb-4">Chats</h2>

      {users.map((u) => {
        const isOnline = onlineUsers?.includes(u._id);

        return (
          <div
            key={u._id}
            onClick={() => accessChat(u._id)}
            className="p-2 mb-2 bg-white rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center"
          >
            <span>{u.name}</span>

            {isOnline && (
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;