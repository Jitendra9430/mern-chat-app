const User = require("../models/userModel");

// @desc    Get all users (except logged-in user)
// @route   GET /api/users
// @access  Protected
const getUsers = async (req, res) => {
  try {
    // search query (optional)
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    // find users except current logged-in user
    const users = await User.find(keyword).find({
      _id: { $ne: req.user._id },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getUsers };