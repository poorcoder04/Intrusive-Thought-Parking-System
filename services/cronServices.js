const cron = require('node-cron');
const https = require('https');
const http  = require('http');
const Thought = require('../models/thought');
const { sendWorryEmail } = require('./emailService');

/**
 * Pings the app's own health endpoint every 14 minutes so Render's free tier
 * never spins the service down (Render sleeps after 15 min of inactivity).
 */
const startKeepAlivePing = () => {
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (!appUrl) {
    console.log('[KEEP-ALIVE] No RENDER_EXTERNAL_URL set — skipping self-ping (local dev).');
    return;
  }

  // Ping every 14 minutes (just under Render's 15-min spin-down threshold)
  cron.schedule('*/14 * * * *', () => {
    const url = `${appUrl}/health`;
    const lib = url.startsWith('https') ? https : http;

    lib.get(url, (res) => {
      console.log(`[KEEP-ALIVE] Self-ping → ${url} | status ${res.statusCode}`);
      // Drain the response to free the socket
      res.resume();
    }).on('error', (err) => {
      console.warn(`[KEEP-ALIVE] Self-ping failed: ${err.message}`);
    });
  });

  console.log(`[KEEP-ALIVE] Self-ping scheduler started → ${appUrl}/health every 14 min`);
};

/**
 * Initializes background cron jobs for the application.
 * Fix #4: initCronJobs() is now called AFTER connectDB() resolves (see index.js).
 */
const initCronJobs = () => {
  // Start the Render keep-alive pinger
  startKeepAlivePing();

  // Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const dueThoughts = await Thought.find({
        worryTime: { $lte: now },
        isNotified: false
      }).populate('user', 'name email');

      if (dueThoughts.length === 0) return;

      console.log(`[CRON] ${dueThoughts.length} worry session(s) due.`);

      for (const thought of dueThoughts) {
        // Safety: skip orphaned thoughts (user account deleted)
        if (!thought.user) {
          thought.isNotified = true;
          await thought.save();
          continue;
        }

        // Fix #8: Log only the email and thought ID — never log private thought content
        console.log(`[CRON] Dispatching reminder to ${thought.user.email} (thought: ${thought._id})`);

        try {
          await sendWorryEmail(thought.user.email, thought.user.name, thought.content);
          console.log(`[CRON] ✓ Email sent to ${thought.user.email}`);
          thought.isNotified = true;
          await thought.save();
        } catch (emailError) {
          // Leave isNotified=false so it retries next minute
          console.error(`[CRON] ✗ Email failed for ${thought.user.email}:`, emailError.message);
        }
      }
    } catch (error) {
      console.error('[CRON] Job error:', error.message);
    }
  });

  console.log('[CRON] Background job scheduler initialized.');
};

module.exports = { initCronJobs };
