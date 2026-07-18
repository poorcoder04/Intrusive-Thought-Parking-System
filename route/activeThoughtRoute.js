const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getActiveThoughts} = require('../controller/activeThought');

// All thoughts endpoints require a logged-in user
router.use(protect);

// GET /api/thoughts/active - Retrieve unnotified parked thoughts
router.get('/active', getActiveThoughts);

module.exports = router;