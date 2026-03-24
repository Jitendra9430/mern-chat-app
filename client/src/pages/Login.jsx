import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  
  const handleLogin = async () => {
  try {
    console.log("Sending request...");

    const { data } = await API.post("/user/login", {
      email,
      password,
    });

    console.log("✅ RESPONSE:", data);

    localStorage.setItem("user", JSON.stringify(data));

    console.log("SAVED:", localStorage.getItem("user"));

    navigate("/");
  } catch (error) {
    console.log(" ERROR:", error.response?.data || error.message);
    alert("Login failed");
  }
};

  return (
    <div>
      <h2>Login</h2>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
