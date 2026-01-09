const sgMail = require("@sendgrid/mail");
require("dotenv").config();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetPasswordEmail(to, token, resetUrl, options = {}) {
  if (!to) throw new Error("Recipient email is required");
  if (!token) throw new Error("Reset token is required");
  if (!resetUrl) throw new Error("Reset URL is required");

  const appName = options.appName || process.env.APP_NAME || "SRK";
  const fromEmail = process.env.FROM_EMAIL || "reegank20@gmail.com";
  const templateId = process.env.SENDGRID_RESET_PASSWORD_TEMPLATE_ID;
  const expiresInMinutes = options.expiresInMinutes || 15;

  console.log("Using SendGrid for email sending");

  try {
    // If template ID is provided, use SendGrid template
    if (templateId) {
      const msg = {
        to: to,
        from: fromEmail,
        templateId: templateId,
        dynamicTemplateData: {
          app_name: appName,
          reset_url: resetUrl,
          token: token,
          expires_in_minutes: expiresInMinutes,
          year: new Date().getFullYear(),
        },
      };

      await sgMail.send(msg);
      console.log(`Reset password email sent successfully to ${to}`);
    } else {
      // Fallback: Send plain text email if no template
      const msg = {
        to: to,
        from: fromEmail,
        subject: `${appName} Password Reset`,
        text: `You requested a password reset. Click this link to reset your password: ${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes.\n\nIf you didn't request this, please ignore this email.`,
        html: `
          <h2>${appName} Password Reset</h2>
          <p>You requested a password reset.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>This link expires in ${expiresInMinutes} minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      };

      await sgMail.send(msg);
      console.log(`Reset password email sent successfully to ${to} (no template)`);
    }
  } catch (error) {
    console.error("Failed to send reset password email via SendGrid:", error.message);

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
