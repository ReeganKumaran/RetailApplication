const express = require("express");
const { signup, verifySignup, login } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/signup/verify", verifySignup);
router.post("/login", login);
// router.post("/forgot-password", forgotPassword)

module.exports = router;

