require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { logger } = require("./helper/logger");
const PORT = process.env.PORT || 5000;
// Use 0.0.0.0 in production (Render) and localhost in development
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err);
  process.exit(1);
});

(async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, HOST, () => {
      logger.info(`✅ Server running on http://${HOST}:${PORT}`);
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! 💥 Shutting down...", err);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
})();
