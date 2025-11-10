const { Resend } = require('resend');
require("dotenv").config();

// Initialize Resend client with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Wrapper to maintain compatibility with existing nodemailer-style code
const transporter = {
  sendMail: async (mailOptions) => {
    try {
      console.log("Using Resend for email sending");
      const data = await resend.emails.send({
        from: mailOptions.from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = transporter;
