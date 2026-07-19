require('dotenv').config();
const nodemailer = require('nodemailer');


// Create the transporter pool
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS // Your app password
  }
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error.message);
  } else {
    console.log('SMTP Server is ready to route worry alerts');
  }
});

/**
 * Sends a notification email when a user's worry window opens
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - Recipient name
 * @param {string} thoughtContent - The intrusive thought text
 */
exports.sendWorryEmail = async (toEmail, userName, thoughtContent) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "🚨 Ding Ding! It's Time to Worry! 🚨",
    text: `Hey ${userName},\n\nYour scheduled worry window has arrived. You successfully parked this thought earlier so you could focus. Now, it is time to give it your full attention:\n\n"${thoughtContent}"\n\nHappy panicking!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px dashed #ff4757; border-radius: 10px; max-width: 600px; margin: 0 auto; background-color: #fffaf0;">
        <h2 style="color: #ff4757; text-align: center;">🚨 Attention: The Worry Gates are Open! 🚨</h2>
        <p>Hey <strong>${userName}</strong>,</p>
        <p>As requested, we safely parked your intrusive thought so you could actually get things done today. But a deal is a deal—your scheduled worry window is officially open.</p>
        
        <div style="background-color: #ffeae8; border-left: 5px solid #ff4757; padding: 15px; margin: 20px 0; font-style: italic; color: #333; font-size: 1.1em;">
          "${thoughtContent}"
        </div>
        
        <p style="text-align: center; font-weight: bold; margin-top: 30px; color: #57606f;">
          You have permission to fret about this now. Go wild!
        </p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #a4b0be; text-align: center;">
          Sent automatically by Thought Parking System. Because your anxiety deserves an organized schedule.
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};