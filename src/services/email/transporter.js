const sgMail = require('@sendgrid/mail');
require("dotenv").config();

// Initialize SendGrid with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Wrapper to maintain compatibility with existing nodemailer-style code
const transporter = {
  sendMail: async (mailOptions) => {
    try {
      console.log("Using SendGrid for email sending");
      const msg = {
        from: mailOptions.from || process.env.SENDGRID_FROM_EMAIL,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
        text: mailOptions.text,
      };
      const response = await sgMail.send(msg);
      return response;
    } catch (error) {
      console.error('SendGrid Error:', error.response ? error.response.body : error.message);
      throw error;
    }
  }
};

module.exports = transporter;
