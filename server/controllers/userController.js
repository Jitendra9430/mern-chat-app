import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔑 Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ================= GET USERS =================

export const getUsers = async (req, res) => {
  try {
    console.log("REQ.USER:", req.user); // debug

    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= LOGIN USER =================

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 Find user in DB
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id), // ✅ REAL TOKEN
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};