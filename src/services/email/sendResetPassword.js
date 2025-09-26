const fs = require("fs");
const path = require("path");
require("dotenv").config();
const transporter = require("./transporter");

async function sendResetPasswordEmail(to, token, resetUrl, options = {}) {
  if (!to) throw new Error("Recipient email is required");
  if (!token) throw new Error("Reset token is required");
  if (!resetUrl) throw new Error("Reset URL is required");

  const appName = options.appName || "SRK Retail";
  const supportEmail = options.supportEmail || "support@srkretail.com";
  const expiresInMinutes = options.expiresInMinutes || 15;

  try {
    const templatePath = path.join(__dirname, "templates", "reset-password.html");
    const htmlTemplate = fs.readFileSync(templatePath, "utf8");

    const html = htmlTemplate
      .replaceAll("{{appName}}", appName)
      .replaceAll("{{resetUrl}}", String(resetUrl))
      .replaceAll("{{token}}", String(token))
      .replaceAll("{{supportEmail}}", supportEmail)
      .replaceAll("{{expiresInMinutes}}", String(expiresInMinutes))
      .replaceAll("{{year}}", String(new Date().getFullYear()));

    await transporter.sendMail({
      from: `"${appName}" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${appName} password reset instructions`,
      html,
    });
  } catch (error) {
    console.error("Failed to send reset password email:", error.message);
    throw error;
  }
}

module.exports = sendResetPasswordEmail;
