const sgMail = require("@sendgrid/mail");
require("dotenv").config();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendOtpEmail(to, otp, actionUrl) {
  const appName = process.env.APP_NAME || "SRK";
  const fromEmail = process.env.FROM_EMAIL || "reegank20@gmail.com";
  const templateId = process.env.SENDGRID_OTP_TEMPLATE_ID || "d-0d1da8571eef4693965293b5c1c97524";

  console.log("Using SendGrid for email sending");

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

    await sgMail.send(msg);
    console.log(`OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error("Failed to send OTP email via SendGrid:", error.message);

    if (error.response) {
      console.error("SendGrid Error Details:", {
        statusCode: error.response.statusCode,
        body: error.response.body,
      });
    }

    // Re-throw the error to let the caller handle it
    throw error;
  }
}

module.exports = sendOtpEmail;
