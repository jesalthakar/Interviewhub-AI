const Joi = require('joi');
const Interview = require('../models/Interview');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');

/**
 * Minutes allowed per question based on difficulty
 * easy: 2 min/question, medium: 3 min/question, hard: 4 min/question
 */
const MINUTES_PER_DIFFICULTY = { easy: 2, medium: 3, hard: 4 };

const createInterviewSchema = Joi.object({
  role: Joi.string().trim().max(150).required(),
  experienceLevel: Joi.string().valid('fresher', 'junior', 'mid', 'senior').required(),
  skills: Joi.array().items(Joi.string().trim().max(100)).min(1).max(20).required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
  questionCount: Joi.number().integer().min(1).max(30).default(10),
});

const submitAnswerSchema = Joi.object({
  text: Joi.string().trim().max(10000).required(),
  durationSeconds: Joi.number().integer().min(0).optional(),
});

/**
 * Create new interview and generate questions via Gemini AI
 */
exports.createInterview = async (req, res, next) => {
  try {
    const { error, value } = createInterviewSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: 'Invalid interview setup',
        errors: error.details.map((detail) => detail.message),
      });
    }

    const skills = value.skills.map((skill) => skill.trim());
    const normalizedSkills = new Set(skills.map((skill) => skill.toLowerCase()));
    if (normalizedSkills.size !== skills.length) {
      return res.status(400).json({ message: 'Skills must not contain duplicates' });
    }

    let questions = [];
    let status = 'in_progress';

    try {
      logger.info('Generating AI interview questions...', {
        role: value.role,
        level: value.experienceLevel,
      });

      const aiQuestions = await aiService.generateInterviewQuestions({
        role: value.role,
        experienceLevel: value.experienceLevel,
        skills,
        difficulty: value.difficulty,
        questionCount: value.questionCount,
      });

      questions = aiQuestions.map((q, idx) => ({
        order: q.order || idx + 1,
        text: q.text,
        category: q.category || 'Technical',
        difficulty: q.difficulty || value.difficulty,
        expectedPoints: q.expectedPoints || [],
        status: 'pending',
      }));
    } catch (aiError) {
      logger.error('Failed to generate questions via AI:', aiError);
      return res.status(503).json({
        message: 'Failed to generate interview questions via AI service. Please ensure GEMINI_API_KEY is configured and valid.',
        error: aiError.message,
      });
    }

    const interview = await Interview.create({
      user: req.user.userId,
      role: value.role,
      experienceLevel: value.experienceLevel,
      skills,
      difficulty: value.difficulty,
      questionCount: value.questionCount,
      durationMinutes: value.questionCount * MINUTES_PER_DIFFICULTY[value.difficulty],
      status,
      currentQuestionIndex: 0,
      questions,
      startedAt: new Date(),
      lastActivityAt: new Date(),
    });

    logger.info('Interview created with AI questions', {
      interviewId: interview._id.toString(),
      userId: req.user.userId,
      questionCount: questions.length,
    });

    return res.status(201).json({ interview });
  } catch (error) {
    logger.error('Create interview error', error);
    next(error);
  }
};

/**
 * Get interview details by ID
 */
exports.getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    return res.status(200).json({ interview });
  } catch (error) {
    logger.error('Get interview by id error', error);
    next(error);
  }
};

/**
 * Submit answer for a specific question and evaluate via AI
 */
exports.submitAnswer = async (req, res, next) => {
  try {
    const { id, questionIndex } = req.params;
    const qIndex = parseInt(questionIndex, 10);

    const { error, value } = submitAnswerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const interview = await Interview.findOne({ _id: id, user: req.user.userId });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (qIndex < 0 || qIndex >= interview.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }

    const question = interview.questions[qIndex];

    // Evaluate answer via Gemini AI
    logger.info(`Evaluating answer for interview ${id}, question #${qIndex + 1}`);
    const evaluation = await aiService.evaluateQuestionAnswer({
      questionText: question.text,
      category: question.category,
      difficulty: question.difficulty,
      expectedPoints: question.expectedPoints,
      candidateAnswer: value.text,
    });

    // Update question state
    question.answer = {
      text: value.text,
      submittedAt: new Date(),
      durationSeconds: value.durationSeconds || 0,
    };
    question.feedback = {
      score: evaluation.score,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      idealAnswer: evaluation.idealAnswer,
      evaluatedAt: new Date(),
    };
    question.status = 'answered';

    // Move to next question index if possible
    if (interview.currentQuestionIndex <= qIndex && qIndex < interview.questions.length - 1) {
      interview.currentQuestionIndex = qIndex + 1;
    }

    interview.lastActivityAt = new Date();
    await interview.save();

    return res.status(200).json({
      message: 'Answer submitted and evaluated successfully',
      question: interview.questions[qIndex],
      currentQuestionIndex: interview.currentQuestionIndex,
    });
  } catch (error) {
    logger.error('Submit answer error', error);
    next(error);
  }
};

/**
 * Finish interview
 * Called when:
 *   - User clicks "Finish Interview" and confirms the dialog
 *   - Overall timer reaches zero (frontend triggers this)
 * Marks remaining pending questions as skipped, generates overall AI feedback, and closes the interview.
 */
exports.finishInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status === 'completed' || interview.status === 'abandoned') {
      return res.status(400).json({ message: `Interview is already ${interview.status}` });
    }

    // Mark any still-pending questions as skipped so they are not left in limbo
    interview.questions.forEach((q) => {
      if (q.status === 'pending') {
        q.status = 'skipped';
      }
    });

    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.lastActivityAt = new Date();

    // If at least some questions were answered, generate overall feedback
    const answeredQuestions = interview.questions.filter((q) => q.status === 'answered');
    if (answeredQuestions.length > 0) {
      try {
        const overall = await aiService.generateOverallFeedback({
          role: interview.role,
          experienceLevel: interview.experienceLevel,
          questionsWithEvaluation: interview.questions,
        });
        interview.overallFeedback = overall;
        interview.evaluationStatus = 'completed';
      } catch (err) {
        logger.error('Failed to generate overall feedback on finish:', err);
        interview.evaluationStatus = 'failed';
      }
    }

    await interview.save();

    logger.info('Interview finished', {
      interviewId: interview._id.toString(),
      userId: req.user.userId,
      answeredCount: answeredQuestions.length,
      totalQuestions: interview.questions.length,
    });

    return res.status(200).json({
      message: 'Interview finished successfully',
      interviewId: interview._id,
      interviewStatus: interview.status,
      overallFeedback: interview.overallFeedback ?? null,
    });
  } catch (error) {
    logger.error('Finish interview error', error);
    next(error);
  }
};
