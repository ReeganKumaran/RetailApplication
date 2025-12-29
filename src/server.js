require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;
// Use 0.0.0.0 in production (Render) and localhost in development
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';

(async () => {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
  });
})();
