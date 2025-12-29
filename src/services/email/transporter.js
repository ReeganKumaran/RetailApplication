const nodemailer = require('nodemailer');
require("dotenv").config();

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT) || 60000,
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT) || 60000,
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT) || 60000,
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Gmail SMTP configuration error:', error);
  } else {
    console.log('Gmail SMTP server is ready to send emails');
  }
});

module.exports = transporter;
