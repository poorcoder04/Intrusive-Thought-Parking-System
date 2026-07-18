const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getThoughtHistory // Import the history controller
} = require('../controller/notifiedThought');

// All thoughts endpoints require a logged-in user
router.use(protect);

// GET /api/thoughts/history - Retrieve notified/past thoughts for pattern analysis
router.get('/history', getThoughtHistory);

module.exports = router;