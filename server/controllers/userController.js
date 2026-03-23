 import User from "../models/userModel.js";

// @desc    Get all users (except logged-in user)
// @route   GET /api/users
// @access  Protected
export const getUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(keyword).find({
      _id: { $ne: req.user._id },
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};