const Thought = require('../models/thought');

/**
 * GET /api/thoughts/history
 * Retrieves all past, notified thoughts for the logged-in user to analyze patterns.
 */
exports.getThoughtHistory = async (req, res) => {
  try {
    // Find notified thoughts, sort by worryTime descending (most recent first)
    const history = await Thought.find({
      user: req.user.id,
      isNotified: true
    }).sort({ worryTime: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve thought history',
      error: error.message
    });
  }
};
