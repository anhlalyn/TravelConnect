const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (to, subject, text) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const emailUser = process.env.EMAIL_USER;

  if (brevoApiKey && emailUser) {
    console.log(`[EMAIL] Sending REAL email to: ${to} using Brevo API...`);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'TravelConnect Support', email: emailUser },
          to: [{ email: to }],
          subject: subject,
          textContent: text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const result = await response.json();
      console.log(`[EMAIL] Real email sent successfully! Message ID:`, result.messageId);
      return result;
    } catch (err) {
      console.error(`[EMAIL] Failed to send real email via Brevo:`, err.message);
      // fallback to mock console log if API fails
    }
  }

  console.log('\n==================================================');
  console.log(`[EMAIL MOCK] Sending email to: ${to}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Body: ${text}`);
  console.log('==================================================\n');
  return { messageId: 'mock-email-id' };
};

module.exports = sendEmail;
