const Thought = require('../models/thought');
const { parseWorryTime } = require('../utils/dateParser');

exports.parkNewThought = async (req, res) => {
  try {
    const { content, dateOption, time } = req.body;

    // Validate input presence
    if (!content || !dateOption || !time) {
      return res.status(400).json({ 
        message: 'Content, date option (Today/Tomorrow/The next day), and time are required.' 
      });
    }

    // Convert friendly presets to a real Date object
    let calculatedWorryTime;
    try {
      calculatedWorryTime = parseWorryTime(dateOption, time);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Check if the calculated time is in the past (e.g., choosing 'Today' at 2:00 PM when it's already 3:00 PM)
    if (calculatedWorryTime <= new Date()) {
      return res.status(400).json({ 
        message: 'The time you selected has already passed for today. Please pick a later time or choose Tomorrow.' 
      });
    }

    // Save to database
    const newThought = await Thought.create({
      user: req.user.id, // Protected route provides this
      content,
      worryTime: calculatedWorryTime
    });

    res.status(201).json({
      message: 'Thought successfully parked. Go focus on your work!',
      thought: newThought
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};