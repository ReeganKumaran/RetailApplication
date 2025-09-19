const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
  connectionTimeout: 5000, // 5 seconds connection timeout
  greetingTimeout: 5000,   // 5 seconds greeting timeout
  socketTimeout: 10000,    // 10 seconds socket timeout
});

async function sendOtpEmail(to, otp, actionUrl) {
  const appName = "SRK Retail";
  const supportEmail = "support@srkretail.com";

  try {
    const templatePath = path.join(__dirname, "templates", "otp.html");

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const html = htmlTemplate
      .replaceAll("{{appName}}", appName)
      .replaceAll("{{otp}}", String(otp ?? ""))
      .replaceAll("{{actionUrl}}", String(actionUrl ?? ""))
      .replaceAll("{{supportEmail}}", supportEmail)
      .replaceAll("{{year}}", String(new Date().getFullYear()));

    await transporter.sendMail({
      from: `"${appName}" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${appName} verification code: ${otp}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error.message);

    // Re-throw the error to let the caller handle it
    throw error;
  }
}

module.exports = sendOtpEmail;
