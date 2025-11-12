require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

(async () => {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
  });
})();
