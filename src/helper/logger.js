const winston = require("winston");
const path = require("path");

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "info";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...args } = info;
    const ts = timestamp.slice(0, 19).replace("T", " ");
    let logMessage = `${ts} [${level}]: ${message}`;
    if (Object.keys(args).length) {
      logMessage += ` ${JSON.stringify(args, null, 2)}`;
    }
    if (stack) {
      logMessage += `\nStack Trace:\n${stack}`;
    }
    return logMessage;
  })
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, stack, ...args } = info;
        const ts = timestamp.slice(0, 19).replace("T", " ");
        let logMessage = `${ts} [${level}]: ${message}`;
        if (Object.keys(args).length) {
          logMessage += ` ${JSON.stringify(args, null, 2)}`;
        }
        if (stack) {
          logMessage += `\nStack Trace:\n${stack}`;
        }
        return logMessage;
      })
    ),
  }),
];

if (process.env.NODE_ENV !== "test") {
  transports.push(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Middleware to log all incoming API calls
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log incoming request
  logger.http(
    `${req.method} ${req.originalUrl || req.url}`
    //   ,{
    //   method: req.method,
    //   url: req.originalUrl || req.url,
    //   ip: req.ip || req.connection.remoteAddress,
    //   userAgent: req.get('user-agent'),
    //   query: req.query,
    //   body: req.method !== 'GET' ? req.body : undefined,
    // }
  );

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.http(
      `${req.method} ${req.originalUrl || req.url} - ${
        res.statusCode
      } - ${duration}ms`,
      // {
      //   method: req.method,
      //   url: req.originalUrl || req.url,
      //   statusCode: res.statusCode,
      //   duration: `${duration}ms`,
      // }
    );
    res.send = originalSend;
    return originalSend.call(this, data);
  };

  next();
};

module.exports = { logger, requestLogger };
