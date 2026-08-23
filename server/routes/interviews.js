const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getUserInterviews,
  createInterview,
  getInterviewById,
  deleteInterview,
  pauseInterview,
  resumeInterview,
  submitAnswer,
  finishInterview,
} = require('../controllers/interviewController');

const router = express.Router();

// GET /api/interviews - Fetch the authenticated user's interview history
router.get('/', authenticate, getUserInterviews);

// POST /api/interviews - Create new interview & generate questions via Gemini AI
router.post('/', authenticate, createInterview);

// GET /api/interviews/:id - Fetch interview details
router.get('/:id', authenticate, getInterviewById);

// DELETE /api/interviews/:id - Delete an interview owned by the authenticated user
router.delete('/:id', authenticate, deleteInterview);

// PATCH /api/interviews/:id/pause - Pause the interview timer while away
router.patch('/:id/pause', authenticate, pauseInterview);

// PATCH /api/interviews/:id/resume - Resume the interview timer
router.patch('/:id/resume', authenticate, resumeInterview);

// POST /api/interviews/:id/questions/:questionIndex/answer - Submit answer & get AI evaluation
router.post('/:id/questions/:questionIndex/answer', authenticate, submitAnswer);

// PATCH /api/interviews/:id/finish - Finish the interview (user intent or timer expiry)
router.patch('/:id/finish', authenticate, finishInterview);

module.exports = router;
