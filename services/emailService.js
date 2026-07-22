require('dotenv').config();
const https = require('https');

// Uses Brevo HTTP API instead of SMTP.
// Render free tier blocks outbound SMTP (ports 465 & 587), but HTTP calls work fine.

/**
 * Sends a notification email via Brevo's HTTP API
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - Recipient name
 * @param {string} thoughtContent - The intrusive thought text
 */
exports.sendWorryEmail = (toEmail, userName, thoughtContent) => {
  const payload = JSON.stringify({
    sender: {
      name:  'Thought Parking Garage',
      email: process.env.BREVO_SENDER_EMAIL
    },
    to: [{ email: toEmail, name: userName }],
    subject: "🚨 Ding Ding! It's Time to Worry! 🚨",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #ff4757; border-radius: 10px; max-width: 600px; margin: 0 auto; background-color: #fffaf0;">
        <h2 style="color: #ff4757; text-align: center;">🚨 Attention: The Worry Gates are Open! 🚨</h2>
        <p>Hey <strong>${userName}</strong>,</p>
        <p>As requested, we safely parked your thought so you could get things done today. But a deal is a deal — your scheduled worry window is officially open.</p>
        <div style="background-color: #ffeae8; border-left: 5px solid #ff4757; padding: 15px; margin: 20px 0; font-style: italic; color: #333; font-size: 1.1em;">
          "${thoughtContent}"
        </div>
        <p style="text-align: center; font-weight: bold; margin-top: 30px; color: #57606f;">
          You have permission to worry about this now. Go wild! 😄
        </p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #a4b0be; text-align: center;">
          Sent automatically by Thought Parking System. Because your anxiety deserves an organized schedule.
        </p>
      </div>
    `
  });

  const options = {
    hostname: 'api.brevo.com',
    path:     '/v3/smtp/email',
    method:   'POST',
    headers: {
      'Content-Type':  'application/json',
      'api-key':       process.env.BREVO_API_KEY,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};
