const Thought = require('../models/Thought');

/**
 * GET /api/thoughts/active
 * Retrieves all parked thoughts for the logged-in user that haven't triggered an email yet.
 */
exports.getActiveThoughts = async (req, res) => {
  try {
    // Find active thoughts, sort by worryTime ascending (soonest first)
    const thoughts = await Thought.find({
      user: req.user.id,
      isNotified: false
    }).sort({ worryTime: 1 });

    res.status(200).json({
      success: true,
      count: thoughts.length,
      thoughts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active thoughts',
      error: error.message
    });
  }
};