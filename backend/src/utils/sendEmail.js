const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);

  if (smtpHost) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
};

const sendEmail = async (to, subject, text) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error(
      'Email transport is not configured. Set SMTP_HOST/SMTP_PORT or EMAIL_USER/EMAIL_PASS.',
    );
  }

  const fromAddress =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_USER ||
    'no-reply@travelconnect.local';

  return transporter.sendMail({
    from: `"TravelConnect Support" <${fromAddress}>`,
    to,
    subject,
    text,
  });
};

module.exports = sendEmail;
