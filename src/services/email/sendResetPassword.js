const sgMail = require("@sendgrid/mail");
require("dotenv").config();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetPasswordEmail(to, otp) {
  if (!to) throw new Error("Recipient email is required");
  if (!otp) throw new Error("OTP is required");

  const appName = process.env.APP_NAME || "SRK";
  const fromEmail = process.env.FROM_EMAIL || "reegank20@gmail.com";
  
  console.log("Using SendGrid for email sending");

  try {
    const msg = {
      to: to,
      from: fromEmail,
      subject: `${appName} Password Reset OTP`,
      text: `Your OTP for password reset is: ${otp}\n\nThis OTP expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <h2>${appName} Password Reset</h2>
        <p>Your One-Time Password (OTP) for resetting your password is:</p>
        <h1 style="font-size: 24px; font-weight: bold;">${otp}</h1>
        <p>This OTP expires in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await sgMail.send(msg);
    console.log(`Reset password OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error("Failed to send reset password OTP email via SendGrid:", error.message);

    if (error.response) {
      console.error("SendGrid Error Details:", {
        statusCode: error.response.statusCode,
        body: error.response.body,
      });
    }

    throw error;
  }
}

module.exports = sendResetPasswordEmail;
