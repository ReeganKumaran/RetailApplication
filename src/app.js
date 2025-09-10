const express = require("express");
const app = express();
//middlewares
const authMiddleware = require("./middlewares/authMiddleware");
const responseMiddleware = require("./middlewares/responseMiddleware");

//models
const User = require("./models/userModel");
const Client = require("./models/clientsModel");
const PendingUser = require("./models/pendingEmailVerfication");

//library
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const dns = require("dns").promises;
const bcrypt = require("bcrypt");
//helper
const sendOtpEmail = require("./domin/send mail/send-otp/user-otp");
const { setDefaultAutoSelectFamily } = require("net");
const { isValidEmail } = require("./helper/helper");

app.use(cookieParser());
app.use(express.json());
app.use(responseMiddleware);

app.get("/", async (req, res) => {
  try {
    return res.success(
      { app: "Retail Application", uptime: process.uptime() },
      "Welcome to the Retail Application"
    );
  } catch (error) {
    return res.error("Something Went Wrong" + error.message);
  }
});

app.post("/signup", async (req, res) => {
  console.log("Sign up attempted", req.body);
  try {
    const { username, email } = req.body;
    const clientIp = req.ip;
    console.log(isValidEmail(email));
    if (!isValidEmail(email) || !username) {
      return res.error("Invaild Email Format or UserName is missing");
    }
    // const domain = email.split("@")[1];
    // const mxOk = await hasMxRecord(domain);
    // if(!mxOk){
    //   return res.error
    // }
    const existsUser = await User.findOne({ email });
    if (existsUser) {
      return res.error("Email already exists", 400);
    }

    const opt = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(opt, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PendingUser.findOneAndUpdate(
      { email },
      {
        username,
        email,
        otpHash,
        attempts: 0,
        createdIp: clientIp,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(email, opt);
    // const newUser = new User({ username, email, password });
    // await newUser.save();
    return res.success({}, "User registered successfully", 201);
  } catch (error) {
    console.error("Error registering user:", error);
    // }
    return res.error(error.message || "Internal Server Error");
  }
});
app.post("/signup/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.error("Email and OTP are requied");
    const pending = await PendingUser.findOne({ email });
    if (!pending)
      return res.error("No Pending verification. Please request a new OTP.");
    if (prnding.expiresAt < new Date()) {
      await Pending.deleteOne({ _id: pending._id });
      return res.error("OPT expired. Please Request a new one.");
    }
    if (pending.attempts >= 5) {
      await Pending.deleteOne({ _id: pending._id });
      return res.error("Too Many Attempt. Please Request a new OTP");
    }
    const ok = await bcrypt.compare(otp, pending.otpHash);
    if (!ok) {
      await Pending.updateOne({ _id: pending._id }, { $inc: { attempts: 1 } });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Create the real user now that email us proven

  } catch (error) {}
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
app.use(authMiddleware);
app.get("/allUser", async (req, res) => {
  try {
    const users = await User.find({});
    return res.success(users, "Users fetched successfully");
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.error(error.message || "Internal Server Error");
  }
});
app.get("/clients", async (req, res) => {
  try {
    const userId = req.user.userId;
    const clients = await Client.find({ userId });
    return res.success(clients, "Clients fetched successfully");
  } catch (error) {
    console.error("Error fetching clients:", error);
    return res.error(error.message || "Internal Server Error");
  }
});
app.post("/clients", async (req, res) => {
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
