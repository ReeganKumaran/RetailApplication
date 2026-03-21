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
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #e0e0e0;
            background-color: #121212;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #121212;
          }
          .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #4CAF50;
          }
          .content {
            background-color: #1e1e1e;
            padding: 40px 30px;
            border-radius: 0 0 10px 10px;
          }
          .content h2 {
            color: #ffffff;
            margin-top: 0;
          }
          .content p {
            color: #b0b0b0;
            font-size: 16px;
          }
          .otp-box {
            background-color: #2a2a2a;
            border: 2px solid #4CAF50;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 8px;
            text-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            background-color: #121212;
          }
          a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover {
            color: #66BB6A;
            text-decoration: underline;
          }
          strong {
            color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p style="color: #b0b0b0; margin: 10px 0 0 0;">Email Verification</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>Your One-Time Password (OTP) for email verification is:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this verification, please ignore this email.</p>
            ${actionUrl ? `<p><a href="${actionUrl}">Click here to verify</a></p>` : ""}
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
