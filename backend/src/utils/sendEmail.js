const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Mã 16 ký tự từ Google
        },
    });

    const mailOptions = {
        from: `"TravelConnect Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;