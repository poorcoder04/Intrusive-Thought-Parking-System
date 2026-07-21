const Thought = require('../models/thought');

/**
 * DELETE /api/thoughts/:id
 Fix:14 Allows a user to cancel/delete a parked (not yet notified) thought.
 * Only the owner of the thought can delete it.
 */
exports.deleteThought = async (req, res) => {
  try {
    const { id } = req.params;

    // Basic ObjectId format check
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid thought ID.' });
    }

    const thought = await Thought.findById(id);

    if (!thought) {
      return res.status(404).json({ message: 'Thought not found.' });
    }

    // Ownership check — users can only delete their own thoughts
    if (thought.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this thought.' });
    }

    // Prevent deleting already-notified thoughts (they are history, not active)
    if (thought.isNotified) {
      return res.status(400).json({ message: 'This thought has already been released and cannot be deleted.' });
    }

    await Thought.findByIdAndDelete(id);

    res.status(200).json({ message: 'Thought deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
