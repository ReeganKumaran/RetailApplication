const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const ownerSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    items: [
      new Schema(
        {
          itemName: { type: String, required: true, trim: true },
          quantity: { type: Number, required: true, default: 0, min: 0 },
        },
        { _id: true }
      ),
    ],
    resetPasswordExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);
// Remove duplicates before applying unique constraint
ownerSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    const seen = new Set();
    this.items = this.items.filter((item) => {
      if (seen.has(item.itemName)) {
        return false; // Remove duplicate
      }
      seen.add(item.itemName);
      return true;
    });
  }
  next();
});
ownerSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const docId = this.getQuery()._id;

  const existData = await this.model.findById(docId).lean();
  const itemName = update.$set["items.$.itemName"];

  if (itemName && itemName !== "" && existData.items.length > 0) {
    const isExist = existData.items.some((item) => item.itemName === itemName);
    if (isExist)
      throw new Error("Duplicate itemName is not allowed: " + itemName);
    else this.setUpdate(update); // ✅ Apply modified update back to the query
  }
  next();
});

ownerSchema.index({ "items.itemName": 1 }, { unique: true });
ownerSchema.pre("save", async function (next) {
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

ownerSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

const Owner = mongoose.model("Owner", ownerSchema);
module.exports = Owner;
