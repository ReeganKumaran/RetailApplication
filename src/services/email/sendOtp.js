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

  logger.info("Gmail API Config:", {
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

    // Create Gmail API instance
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Create email content
    const subject = `${appName} - Email Verification OTP`;
    const htmlBody = `
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
    `;

    // Create the email in RFC 2822 format
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `From: ${appName} <${GMAIL_USER}>`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      htmlBody,
    ];
    const message = messageParts.join("\n");

    // Encode the message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    logger.info("Attempting to send email via Gmail API (HTTP)...");

    // Send email using Gmail API (NOT SMTP)
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    logger.info(`OTP email sent successfully to ${to}`, {
      messageId: result.data.id,
      threadId: result.data.threadId,
    });
  } catch (error) {
    logger.error("Failed to send OTP email via Gmail API:", {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });

    if (error.response) {
      logger.error("Gmail API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    // Re-throw the error to let the caller handle it
    throw error;
  }
}

module.exports = sendOtpEmail;
