const fs = require("fs");
const path = require("path");
require("dotenv").config();
const transporter = require("./transporter");

async function sendOtpEmail(to, otp, actionUrl) {
  const appName = "SRK Retail";
  const supportEmail = "support@srkretail.com";
  console.log("Using Gmail SMTP for email sending");
  try {
    const templatePath = path.join(__dirname, "templates", "otp.html");

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const html = htmlTemplate
      .replaceAll("{{appName}}", appName)
      .replaceAll("{{otp}}", String(otp ?? ""))
      .replaceAll("{{actionUrl}}", String(actionUrl ?? ""))
      .replaceAll("{{supportEmail}}", supportEmail)
      .replaceAll("{{year}}", String(new Date().getFullYear()));

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USERNAME;

    if (!fromEmail) {
      throw new Error("FROM_EMAIL or SMTP_USERNAME environment variable is not configured");
    }

    await transporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
      to,
      subject: `${appName} verification code: ${otp}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error.message);
    console.error("SMTP Config Check:", {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || "587",
      user: process.env.SMTP_USER || process.env.GMAIL_USER || "NOT_SET"
    });

    // Re-throw the error to let the caller handle it
    throw error;
  }
}

module.exports = sendOtpEmail;
