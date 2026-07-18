const express = require('express');
const router = express.Router();
const { parkNewThought } = require('../controller/parkThought');
const { protect } = require('../middleware/authMiddleware');

// Protect the route so only authenticated users can park thoughts
router.post('/park', protect, parkNewThought);
module.exports = router;