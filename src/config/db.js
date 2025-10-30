const mongoose = require("mongoose");
let MONGODB_URI = process.env.MONGODB_LOCAL_URI;
if (process.env.NODE_ENV === "production") {
  MONGODB_URI = process.env.MONGODB_URI;
}
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
module.exports = connectDB;
