import { useState } from "react";
import API from "../services/api";
import {useNavigate} from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    console.log("Sending data:", {
      name,
      email,
      password,
    });
    try {
      const { data } = await API.post("/auth/register", {
        name,
        email,
        password,
      });
      console.log("Full backend response:", data);
       //Auto login after registration
      localStorage.setItem("user", JSON.stringify(data));
      console.log("User Saved:", data);
      navigate("/");
      alert("Registered Successfully!");

    } catch (error) {
        console.log("Full error:", error);
        if(error.response) {
            alert(error.response.data.message);
        } else {
            alert("Something went wrong.");
        }
    }

}
  return (
  <div className="flex items-center justify-center h-screen bg-[#111b21]">
    <div className="bg-[#202c33] p-8 rounded-xl shadow-lg w-96 text-white">
      <h2 className="text-2xl font-semibold mb-6 text-center text-green-400">
        Create Account
      </h2>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 mb-4 bg-[#2a3942] rounded outline-none"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 mb-4 bg-[#2a3942] rounded outline-none"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 mb-6 bg-[#2a3942] rounded outline-none"
      />

      <button
        onClick={handleRegister}
        className="w-full bg-green-500 hover:bg-green-600 p-3 rounded font-semibold"
      >
        Register
      </button>

      <p className="text-sm mt-4 text-center text-gray-400">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-green-400 cursor-pointer"
        >
          Login
        </span>
      </p>
    </div>
  </div>
);
};

export default Register;
