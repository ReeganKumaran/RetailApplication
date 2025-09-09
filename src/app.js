const express = require("express");
const User = require("./models/userModel");
const app = express();
const authMiddleware = require("./middlewares/authMiddleware");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Client = require("./models/clientsModel");
const responseMiddleware = require("./middlewares/responseMiddleware");
app.use(cookieParser());
app.use(express.json());
// attach res.success / res.error to all responses
app.use(responseMiddleware);
app.get("/", (req, res) => {
  return res.success(
    { app: "Retail Application", uptime: process.uptime() },
    "Welcome to the Retail Application"
  );
});

app.post("/signup", async (req, res) => {
  console.log("Sign up attempted", req.body);
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    return res.success({}, "User registered successfully", 201);
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return res.error("Email already exists", 400);
    }
    return res.error(error.message || "Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.error("Invalid email or password", 400);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.error("Invalid email or password", 400);
    }
    console.log(user._id);
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, { httpOnly: true });
    return res.success({ username: user.username, token }, "Login successful");
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.error(error.message || "Internal Server Error");
  }
});

app.get("/allUser", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    return res.success(users, "Users fetched successfully");
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.error(error.message || "Internal Server Error");
  }
});
app.get("/clients", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const clients = await Client.find({ userId });
    return res.success(clients, "Clients fetched successfully");
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.error(error.message || "Internal Server Error");
  }
});
app.post("/clients", authMiddleware, async (req, res) => {
  try {
    const { username, phoneNumber } = req.body;
    const userId = req.user.userId;
    console.log(username, phoneNumber);
    if (!username || !phoneNumber) {
      throw new Error("The payload must include both userName and phoneNumber");
    }
    console.log(userId);
    const client = new Client({ userId, username, phoneNumber });
    await client.save();
    return res.success({ id: client._id }, "Client added successfully", 201);
  } catch (error) {
    return res.error(error.message || "Something Went Wrong");
  }
});
module.exports = app;
