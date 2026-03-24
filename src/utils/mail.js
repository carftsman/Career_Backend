// utils/mail.js
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendResetEmail = async (email, resetURL) => {
  await transporter.sendMail({
    to: email,
    subject: "Reset Your Password",
    html: `
      <h3>Reset Password</h3>
      <p>Click below to reset your password:</p>
      <a href="${resetURL}">Reset Password</a>
      <p>This link expires in 15 minutes</p>
    `
  });
};