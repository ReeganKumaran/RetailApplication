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

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.send("User registered successfully");
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return res.status(400).send("Email already exists");
    }
    return res.status(500).send("Internal Server Error");
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Invalid email or password");
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).send("Invalid email or password");
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "1h",
      }
    );
    res.cookie("token", token, { httpOnly: true }).send("Login successful");

    // res.send({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).send("Internal Server Error");
  }
});
app.get("/allUser", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).send("Internal Server Error");
  }
  // try {
  //   res
  // } catch (error) {

  // }
});
module.exports = app;
