const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const pendingSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

pendingSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const isBcryptHash = (str) =>
      typeof str === "string" &&
      /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
    if (isBcryptHash(this.password)) {
      return next();
    }
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

pendingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PendingEmailVerificationUser", pendingSchema);
