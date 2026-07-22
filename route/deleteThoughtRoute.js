const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { deleteThought } = require('../controller/deleteThought');

// DELETE /api/thoughts/:id  — cancel/remove a parked thought
router.delete('/:id', protect, deleteThought);

module.exports = router;
