const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Owner = require("../models/ownerModel");
const PendingOwner = require("../models/pendingEmailVerfication");
const sendOtpEmail = require("../services/email/sendOtp");
const { isValidEmail, isValidPassword } = require("../helper/helper");

async function signup(req, res) {
  try {
    const { username, email, password, phoneNumber } = req.body;
    const clientIp = req.ip;

    if (!username || !email || !password) {
      return res.error("Ownername, email, and password are required", 400);
    }
    if (!isValidEmail(email)) {
      return res.error("Invalid email format", 400);
    }
    if (!isValidPassword(password)) {
      return res.error(
        "Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character.",
        400
      );
    }

    const existsOwner = await Owner.findOne({ email });
    if (existsOwner) {
      return res.error("Email already exists", 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PendingOwner.findOneAndUpdate(
      { email },
      {
        username,
        password: passwordHash,
        phoneNumber,
        email,
        otpHash,
        attempts: 0,
        createdIp: clientIp,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendOtpEmail(email, otp);
      return res.success({}, "OTP sent to email", 201);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);

      // In development, still return success but with a warning
      if (process.env.NODE_ENV !== 'production') {
        return res.success({
          warning: "Email could not be sent. Check console for OTP in development mode.",
          email: email
        }, "Registration successful (email failed - check console for OTP)", 201);
      }

      // In production, return error
      return res.error("Failed to send verification email. Please try again later.", 503);
    }
  } catch (error) {
    console.error("Error registering user:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

async function verifySignup(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.error("Email and OTP are required", 400);
    }

    const existsOwner = await Owner.findOne({ email });
    if (existsOwner) {
      return res.error("Email already verified. Please login.", 400);
    }

    const pending = await PendingOwner.findOne({ email });
    if (!pending) {
      return res.error("No pending verification. Please request a new OTP.", 400);
    }

    if (pending.expiresAt < new Date()) {
      await PendingOwner.deleteOne({ _id: pending._id });
      return res.error("OTP expired. Please request a new one.", 400);
    }

    if (pending.attempts >= 5) {
      await PendingOwner.deleteOne({ _id: pending._id });
      return res.error("Too many attempts. Please request a new OTP.", 400);
    }

    const ok = await bcrypt.compare(otp, pending.otpHash);
    if (!ok) {
      await PendingOwner.updateOne(
        { _id: pending._id },
        { $inc: { attempts: 1 } }
      );
      return res.error("Invalid OTP", 400);
    }

    const newOwner = new Owner({
      username: pending.username,
      email: pending.email,
      password: pending.password,
      emailVerified: true,
    });
    await newOwner.save();

    const token = jwt.sign(
      { userId: newOwner._id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    await PendingOwner.deleteOne({ _id: pending._id });
    return res.success({ token }, "Email verified successfully");
  } catch (error) {
    return res.error(error.message || "Internal Server Error");
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.error("Email and password are required", 400);
    }

    const user = await Client.findOne({ email });
    if (!user) {
      return res.error("Invalid email or password", 400);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.error("Invalid email or password", 400);
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.success({ username: user.username, token }, "Login successful");
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.error(error.message || "Internal Server Error");
  }
}

module.exports = { signup, verifySignup, login };
