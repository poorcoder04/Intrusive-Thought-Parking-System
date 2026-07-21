const cron = require('node-cron');
const Thought = require('../models/thought');
const { sendWorryEmail } = require('./emailService');

/**
 * Initializes background cron jobs for the application.
 * Fix #4: initCronJobs() is now called AFTER connectDB() resolves (see index.js).
 */
const initCronJobs = () => {
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
