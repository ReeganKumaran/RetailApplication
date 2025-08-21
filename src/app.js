const express = require("express");
const User = require("./models/userModel");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Retail Application");
});

app.post("/", async (req, res) => {
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
module.exports = app;
