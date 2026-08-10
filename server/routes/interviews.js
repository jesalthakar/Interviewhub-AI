const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { createInterview } = require('../controllers/interviewController');

const router = express.Router();

// POST /api/interviews
router.post('/', authenticate, createInterview);

module.exports = router;
