const mongoose = require("mongoose");

const pendingSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
    unique: true,
  },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  otpHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdIp: { type: String },
  expiresAt: { type: Date, required: true },
});

pendingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PendingEmailVerificationUser", pendingSchema);
