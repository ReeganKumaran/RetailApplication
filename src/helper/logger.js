const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const getLevel = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "cyan",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...args } = info;
    const ts = (timestamp || "").toString().slice(0, 19);

    let log = `${ts} [${level}]: ${message}`;

    // Add additional metadata if present (excluding internal winston props)
    const meta = Object.keys(args).filter(key => !['timestamp', 'level', 'message', 'service'].includes(key));
    if (meta.length > 0) {
      log += `\nMetadata: ${JSON.stringify(args, null, 2)}`;
    }

    if (stack) {
      log += `\nStack: ${stack}`;
    }

    return log;
  })
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
];

const logger = winston.createLogger({
  level: getLevel(),
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * Middleware for logging HTTP requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request when it comes in
  logger.http(`Incoming Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    query: req.query,
    body: (req.method !== "GET" && req.body) ? req.body : undefined,
  });

  // Track the finish of the request
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
    };

    if (statusCode >= 400) {
      logger.error(`${req.method} ${req.originalUrl} failed with status ${statusCode}`, logData);
    } else {
      logger.info(`${req.method} ${req.originalUrl} completed in ${duration}ms`, logData);
    }
  });

  next();
};

module.exports = { logger, requestLogger };
