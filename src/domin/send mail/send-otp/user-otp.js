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
});

async function sendOtpEmail(to, otp, actionUrl) {
  const appName = "SRK Retail";
  const supportEmail = "support@srkretail.com";

  const templatePath = path.join(
    __dirname,
    "../",
    "template",
    "otp.html"
  );

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
}

module.exports = sendOtpEmail;
