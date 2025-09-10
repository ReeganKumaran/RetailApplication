const User = require("../models/userModel");

async function listUsers(req, res) {
  try {
    const users = await User.find({});
    return res.success(users, "Users fetched successfully");
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

module.exports = { listUsers };

