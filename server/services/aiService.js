const { GoogleGenAI, Type } = require('@google/genai');
const logger = require('../utils/logger');

/**
 * Helper to initialize the Gemini AI client using @google/genai SDK
 */
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log(apiKey);
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY is not configured in environment variables');
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * JSON Schema for generating interview questions
 */
const questionsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          text: { type: Type.STRING },
          category: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          expectedPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['order', 'text', 'category', 'difficulty', 'expectedPoints'],
      },
    },
  },
  required: ['questions'],
};

/**
 * JSON Schema for evaluating an individual question answer
 */
const answerEvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    idealAnswer: { type: Type.STRING },
  },
  required: ['score', 'summary', 'strengths', 'improvements', 'idealAnswer'],
};

/**
 * JSON Schema for generating overall interview feedback
 */
const overallFeedbackSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['score', 'summary', 'strengths', 'improvements', 'recommendedTopics'],
};

/**
 * Generate interview questions using Gemini 2.0 Flash
 */
exports.generateInterviewQuestions = async ({
  role,
  experienceLevel,
  skills,
  difficulty,
  questionCount = 10,
}) => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI Service unavailable: GEMINI_API_KEY is missing.');
  }

  const prompt = `You are a Principal Software Engineer and Technical Hiring Manager conducting an interview.
Generate exactly ${questionCount} high-quality interview questions for a candidate with the following profile:
- Targeted Role: ${role}
- Experience Level: ${experienceLevel}
- Specific Skills/Technologies: ${skills.join(', ')}
- Difficulty Level: ${difficulty}

Guidelines:
1. Questions should test real-world scenarios, core principles, problem-solving, and practical technical knowledge suitable for a ${experienceLevel} level candidate.
2. For each question, provide 3 to 5 clear "expectedPoints" (key concepts/answers expected from a strong candidate).
3. Specify a concise category for each question (e.g., "Architecture", "State Management", "Performance", "Security", "Coding Practices").
4. Assign sequential order from 1 to ${questionCount}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: questionsResponseSchema,
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text);

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('Invalid AI response structure: questions array missing');
    }

    return data.questions;
  } catch (error) {
    logger.error('Gemini question generation error:', error);
    throw error;
  }
};

/**
 * Evaluate a single candidate answer against expected points
 */
exports.evaluateQuestionAnswer = async ({
  questionText,
  category,
  difficulty,
  expectedPoints = [],
  candidateAnswer,
}) => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI Service unavailable: GEMINI_API_KEY is missing.');
  }

  const prompt = `You are an expert technical interviewer evaluating a candidate's answer.

Question Category: ${category}
Difficulty: ${difficulty}
Question: ${questionText}
Expected Key Points:
${expectedPoints.map((p) => `- ${p}`).join('\n')}

Candidate's Submitted Answer:
"${candidateAnswer}"

Evaluate the candidate's answer objectively:
1. Score out of 100 based on technical accuracy, completeness, and clarity.
2. Summary: A 1-2 sentence executive feedback summary.
3. Strengths: Bullet points highlighting what the candidate explained well.
4. Improvements: Bullet points detailing missing expected points or incorrect statements.
5. Ideal Answer: Provide a concise, comprehensive model answer.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: answerEvaluationSchema,
        temperature: 0.3,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    logger.error('Gemini answer evaluation error:', error);
    throw error;
  }
};

/**
 * Generate overall interview performance feedback synthesis
 */
exports.generateOverallFeedback = async ({ role, experienceLevel, questionsWithEvaluation }) => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('AI Service unavailable: GEMINI_API_KEY is missing.');
  }

  const evaluationsText = questionsWithEvaluation
    .map(
      (q, idx) => `
Question ${idx + 1} (${q.category}): ${q.text}
Candidate Answer: ${q.answer?.text || 'No answer provided'}
Score: ${q.feedback?.score ?? 'N/A'}/100
Strengths: ${q.feedback?.strengths?.join('; ') || 'None'}
Improvements: ${q.feedback?.improvements?.join('; ') || 'None'}
`
    )
    .join('\n---\n');

  const prompt = `You are a Technical Hiring Committee Lead reviewing a candidate's full technical interview performance.

Candidate Profile:
- Role: ${role}
- Level: ${experienceLevel}

Interview Summary Data:
${evaluationsText}

Provide an overall assessment:
1. Score (0-100): Aggregated performance score.
2. Summary: Overall assessment of candidate's readiness for the ${role} position.
3. Strengths: Top 3-5 macro strengths demonstrated across the interview.
4. Improvements: Top 3-5 macro areas needing improvement before real interviews.
5. Recommended Topics: List of 3-5 specific technical topics or tools to study further.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: overallFeedbackSchema,
        temperature: 0.4,
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    logger.error('Gemini overall feedback error:', error);
    throw error;
  }
};
