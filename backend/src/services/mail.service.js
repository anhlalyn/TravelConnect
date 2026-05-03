const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: "TravelConnect",
    to: email,
    subject: "Mã OTP xác thực",
    text: `Mã OTP của bạn là: ${otp}`
  });
};