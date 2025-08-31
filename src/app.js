const express = require("express");
const User = require("./models/userModel");
const app = express();
const authMiddleware = require("./middlewares/authMiddleware");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Retail Application");
});

app.post("/signup", async (req, res) => {
  console.log("Sign up attempted", req.body);
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({message: "User registered successfully"});
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return res.status(400).json({message: "Email already exists"});
    }
    return res.status(500).json({message: "Internal Server Error"});
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({message: "Invalid email or password"});
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({message: "Invalid email or password"});
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, { httpOnly: true }).json({username: user.username, message: "Login successful"});
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({message: "Internal Server Error"});
  }
});

app.get("/allUser", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({message: "Internal Server Error"});
  }
});
module.exports = app;
