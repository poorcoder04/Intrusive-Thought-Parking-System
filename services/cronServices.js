const cron = require('node-cron');
const Thought = require('../models/thought');
const { sendWorryEmail } = require('./emailService');


/**
 * Initializes background cron jobs for the application
 */
const initCronJobs = () => {
  // Runs every minute: 'seconds minutes hours day-of-month month day-of-week'
  cron.schedule('* * * * *', async () => {
    console.log('--- Running background check for due worry windows ---');

    try {
      const now = new Date();

      // Find all thoughts where worryTime has passed and notification hasn't fired yet
      // Populate 'user' to get the email and name easily
      const dueThoughts = await Thought.find({
        worryTime: { $lte: now },
        isNotified: false
      }).populate('user', 'name email');

      if (dueThoughts.length === 0) {
        console.log('No worry sessions due at this time.');
        return;
      }

      console.log(`Found ${dueThoughts.length} worry session(s) to trigger.`);

      // Process each due thought
      for (const thought of dueThoughts) {
        // Safety check in case a user account was deleted
        if (!thought.user) {
          thought.isNotified = true;
          await thought.save();
          continue;
        }

        console.log(`[TRIGGER] Sending email to ${thought.user.email}: "${thought.content}"`);

        try {
        // 1. Dispatch the funny email
        await sendWorryEmail(thought.user.email, thought.user.name, thought.content);
        console.log(`[SUCCESS] Worry email dispatched to ${thought.user.email}`);

        // 2. Mark as notified so it transitions to history safely
        thought.isNotified = true;
        await thought.save();
  } catch (emailError) {
    console.error(`[ERROR] Failed sending email to ${thought.user.email}:`, emailError.message);
    // Note: Leaving isNotified false ensures it retries on the next minute cycle
  }
      }

      console.log('--- Background job completed successfully ---');
    } catch (error) {
      console.error('Error executing cron job:', error.message);
    }
  });
};

module.exports = { initCronJobs };