require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const PORT = process.env.PORT || "5000";
const HOST = "0.0.0.0";

(async () => {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(
      `Server is running at http://${
        HOST === "0.0.0.0" ? "your-lan-ip" : HOST
      }:${PORT}`
    );
  });
})();
