const Thought = require('../models/thought');
const { parseWorryTime } = require('../utils/dateParser');

exports.parkNewThought = async (req, res) => {
  try {
    const { content, dateOption, time, tzOffset, customDate } = req.body;

    // Fix #7: Validate presence AND reject whitespace-only content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Thought content cannot be empty.' });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ message: 'Thought content must be under 1000 characters.' });
    }
    if (!dateOption) {
      return res.status(400).json({ message: 'Please select a date option.' });
    }
    if (!time) {
      return res.status(400).json({ message: 'Please select a time.' });
    }

    // Fix #3: Pass client timezone offset so dateParser computes correct UTC time
    const clientTzOffset = typeof tzOffset === 'number' ? tzOffset : 0;

    let calculatedWorryTime;
    try {
      calculatedWorryTime = parseWorryTime(dateOption, time, clientTzOffset, customDate);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (calculatedWorryTime <= new Date()) {
      return res.status(400).json({
        message: 'The selected time has already passed. Please pick a future time.'
      });
    }

    const newThought = await Thought.create({
      user: req.user.id,
      content: content.trim(),
      worryTime: calculatedWorryTime
    });

    res.status(201).json({
      message: 'Thought successfully parked. Go focus on your work!',
      thought: newThought
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
