const sgMail = require("@sendgrid/mail");
const { logger } = require("../../helper/logger");
require("dotenv").config();

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  logger.error("CRITICAL: SENDGRID_API_KEY is not set in environment variables!");
}
sgMail.setApiKey(apiKey);

async function sendOtpEmail(to, otp, actionUrl) {
  const appName = process.env.APP_NAME || "SRK";
  const fromEmail = process.env.FROM_EMAIL || "reegank20@gmail.com";
  const templateId = process.env.SENDGRID_OTP_TEMPLATE_ID || "d-0d1da8571eef4693965293b5c1c97524";

  logger.info("SendGrid Email Config:", {
    to,
    from: fromEmail,
    templateId,
    appName,
    hasApiKey: process.env.SENDGRID_API_KEY.slice(-6),
  });

  try {
    const msg = {
      to: to,
      from: fromEmail,
      templateId: templateId,
      dynamicTemplateData: {
        otp: String(otp),
        app_name: appName,
        action_url: actionUrl || "",
        year: new Date().getFullYear(),
      },
    };

    logger.info("Attempting to send email via SendGrid...");
    const response = await sgMail.send(msg);
    logger.info(`OTP email sent successfully to ${to}`, { statusCode: response[0].statusCode });
  } catch (error) {
    logger.error("Failed to send OTP email via SendGrid:", { error: error.message });

    if (error.response) {
      logger.error("SendGrid Error Details:", {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers,
      });
    }

    // Re-throw the error to let the caller handle it
    throw error;
  }
}

module.exports = sendOtpEmail;
