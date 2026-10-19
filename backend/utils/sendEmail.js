const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ShopCart" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("EMAIL ERROR:", error.message);

    throw error;
  }
};

module.exports = sendEmail;
