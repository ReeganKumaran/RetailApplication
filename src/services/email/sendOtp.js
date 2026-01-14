const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { logger } = require("../../helper/logger");
require("dotenv").config();

// Gmail API OAuth2 setup
const OAuth2 = google.auth.OAuth2;

async function sendOtpEmail(to, otp, actionUrl) {
  const appName = process.env.APP_NAME || "SRK";

  // Gmail credentials from environment
  const GMAIL_USER = process.env.GMAIL_USER || process.env.FROM_EMAIL;
  const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
  const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
  const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

  logger.info("Gmail Email Config:", {
    to,
    from: GMAIL_USER,
    appName,
    hasClientId: !!GMAIL_CLIENT_ID,
    hasClientSecret: !!GMAIL_CLIENT_SECRET,
    hasRefreshToken: !!GMAIL_REFRESH_TOKEN,
  });

  try {
    // Create OAuth2 client
    const oauth2Client = new OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: GMAIL_REFRESH_TOKEN,
    });

    // Get access token
    const accessToken = await oauth2Client.getAccessToken();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: GMAIL_USER,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Email content
    const mailOptions = {
      from: `${appName} <${GMAIL_USER}>`,
      to: to,
      subject: `${appName} - Email Verification OTP`,
      text: `Your OTP for email verification is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n${appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .otp-box { background-color: #fff; border: 2px solid #4CAF50; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Email Verification</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Your One-Time Password (OTP) for email verification is:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p><strong>This OTP is valid for 10 minutes.</strong></p>
              <p>If you didn't request this verification, please ignore this email.</p>
              ${actionUrl ? `<p><a href="${actionUrl}" style="color: #4CAF50;">Click here to verify</a></p>` : ""}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    logger.info("Attempting to send email via Gmail API...");

    const result = await transporter.sendMail(mailOptions);

    logger.info(`OTP email sent successfully to ${to}`, {
      messageId: result.messageId,
      response: result.response,
    });
  } catch (error) {
    logger.error("Failed to send OTP email via Gmail API:", {
      error: error.message,
      stack: error.stack,
    });

    // Re-throw the error to let the caller handle it
    throw error;
  }
}

module.exports = sendOtpEmail;
