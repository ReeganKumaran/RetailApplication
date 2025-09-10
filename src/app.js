const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

// middlewares
const responseMiddleware = require("./middlewares/responseMiddleware");

// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const clientRoutes = require("./routes/clientRoutes");

app.use(cookieParser());
app.use(express.json());
app.use(responseMiddleware);

// route mounting
app.use(authRoutes);
app.use(userRoutes);
app.use(clientRoutes);

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
