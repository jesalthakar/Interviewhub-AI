const Joi = require('joi');
const Interview = require('../models/Interview');
const logger = require('../utils/logger');

const createInterviewSchema = Joi.object({
  role: Joi.string().trim().max(150).required(),
  experienceLevel: Joi.string().valid('fresher', 'junior', 'mid', 'senior').required(),
  skills: Joi.array().items(Joi.string().trim().max(100)).min(1).max(20).required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
  questionCount: Joi.number().integer().min(1).max(30).default(10),
});

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

    const interview = await Interview.create({
      user: req.user.userId,
      role: value.role,
      experienceLevel: value.experienceLevel,
      skills,
      difficulty: value.difficulty,
      questionCount: value.questionCount,
      status: 'draft',
      lastActivityAt: new Date(),
    });

    logger.info('Interview created', {
      interviewId: interview._id.toString(),
      userId: req.user.userId,
    });

    return res.status(201).json({ interview });
  } catch (error) {
    logger.error('Create interview error', error);
    next(error);
  }
};
