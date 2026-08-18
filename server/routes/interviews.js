const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  createInterview,
  getInterviewById,
  submitAnswer,
  finishInterview,
} = require('../controllers/interviewController');

const router = express.Router();

// POST /api/interviews - Create new interview & generate questions via Gemini AI
router.post('/', authenticate, createInterview);

// GET /api/interviews/:id - Fetch interview details
router.get('/:id', authenticate, getInterviewById);

// POST /api/interviews/:id/questions/:questionIndex/answer - Submit answer & get AI evaluation
router.post('/:id/questions/:questionIndex/answer', authenticate, submitAnswer);

// PATCH /api/interviews/:id/finish - Finish the interview (user intent or timer expiry)
router.patch('/:id/finish', authenticate, finishInterview);

module.exports = router;
