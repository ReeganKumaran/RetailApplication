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
 console.log("Using SendGrid for email sending");
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

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER;

    if (!fromEmail) {
      throw new Error("SENDGRID_FROM_EMAIL, RESEND_FROM_EMAIL, SMTP_USER, or GMAIL_USER environment variable is not configured");
    }

    await transporter.sendMail({
      from: `"${appName}" <${fromEmail}>`,
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
