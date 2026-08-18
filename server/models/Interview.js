const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const AnswerSchema = new Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 10000 },
    submittedAt: { type: Date, default: Date.now },
    durationSeconds: { type: Number, min: 0 },
  },
  { _id: false }
);

const QuestionFeedbackSchema = new Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    summary: { type: String, trim: true, maxlength: 2000 },
    strengths: [{ type: String, trim: true, maxlength: 500 }],
    improvements: [{ type: String, trim: true, maxlength: 500 }],
    idealAnswer: { type: String, trim: true, maxlength: 10000 },
    evaluatedAt: { type: Date },
  },
  { _id: false }
);

const InterviewQuestionSchema = new Schema(
  {
    order: { type: Number, required: true, min: 1 },
    text: { type: String, required: true, trim: true, maxlength: 3000 },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    expectedPoints: [{ type: String, trim: true, maxlength: 500 }],
    status: {
      type: String,
      enum: ['pending', 'answered', 'skipped'],
      default: 'pending',
    },
    answer: { type: AnswerSchema, default: undefined },
    feedback: { type: QuestionFeedbackSchema, default: undefined },
    askedAt: { type: Date },
  },
  { timestamps: true }
);

const OverallFeedbackSchema = new Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    summary: { type: String, trim: true, maxlength: 3000 },
    strengths: [{ type: String, trim: true, maxlength: 500 }],
    improvements: [{ type: String, trim: true, maxlength: 500 }],
    recommendedTopics: [{ type: String, trim: true, maxlength: 200 }],
  },
  { _id: false }
);

const InterviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true, trim: true, maxlength: 150 },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'junior', 'mid', 'senior'],
      required: true,
    },
    skills: {
      type: [{ type: String, trim: true, maxlength: 100 }],
      required: true,
      validate: {
        validator: (skills) => skills.length > 0,
        message: 'At least one skill is required',
      },
    },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    questionCount: { type: Number, required: true, min: 1, max: 30 },
    durationMinutes: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'abandoned'],
      default: 'draft',
      index: true,
    },
    currentQuestionIndex: { type: Number, default: 0, min: 0 },
    questions: { type: [InterviewQuestionSchema], default: [] },
    evaluationStatus: {
      type: String,
      enum: ['not_started', 'processing', 'completed', 'failed'],
      default: 'not_started',
    },
    overallFeedback: { type: OverallFeedbackSchema, default: undefined },
    startedAt: { type: Date },
    completedAt: { type: Date },
    lastActivityAt: { type: Date },
  },
  { timestamps: true }
);

InterviewSchema.index({ user: 1, status: 1, updatedAt: -1 });

module.exports = model('Interview', InterviewSchema);
