const Sidebar = ({ users, accessChat }) => {
  return (
    <div style={{ width: "30%", borderRight: "1px solid gray" }}>
      <h3>Users</h3>

      {users.map((u) => (
        <div
          key={u._id}
          onClick={() => accessChat(u._id)}
          style={{ cursor: "pointer", padding: "10px" }}
        >
          {u.name}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;