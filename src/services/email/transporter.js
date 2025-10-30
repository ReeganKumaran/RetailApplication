const nodemailer = require("nodemailer");
require("dotenv").config();

// Shared Nodemailer transporter used by all email services.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  },
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT || "60000"),
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT || "60000"),
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT || "60000"),
});

module.exports = transporter;
