const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");

app.use(cors());
// middlewares
const { requestLogger } = require("./helper/logger");
const responseMiddleware = require("./middlewares/responseMiddleware");
const {getIP} = require("./middlewares/ipMiddleware")
// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const rentalRoutes = require("./routes/rentalRoutes");
const itemRoutes = require("./routes/itemRoutes");
const adminRoutes = require("./routes/adminRoutes");
app.use(adminRoutes);

app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);
app.use(responseMiddleware);
app.use(getIP);

// route mounting
app.use(authRoutes);
app.use(userRoutes);
app.use(rentalRoutes);
app.use(itemRoutes);

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


module.exports = app;
