const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, text) => {
  console.log('\n==================================================');
  console.log(`[EMAIL MOCK] Sending email to: ${to}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Body: ${text}`);
  console.log('==================================================\n');
  return { messageId: 'mock-email-id' };
};

module.exports = sendEmail;
