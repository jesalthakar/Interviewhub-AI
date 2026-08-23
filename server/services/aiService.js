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
      model: 'gemini-3.5-flash-lite',
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

  const prompt = `You are a patient, encouraging technical teacher helping a student improve their interview answer.

Question Category: ${category}
Difficulty: ${difficulty}
Question: ${questionText}
Expected Key Points:
${expectedPoints.map((p) => `- ${p}`).join('\n')}

Candidate's Submitted Answer:
"${candidateAnswer}"

Evaluate the candidate's answer fairly and constructively. Use a warm, respectful teaching tone:
1. Start by acknowledging what the student understood or attempted well.
2. Explain gaps or inaccuracies gently, as guidance rather than criticism.
3. Give specific, practical next steps the student can apply in their next answer.
4. Never shame, insult, dismiss, or label the student. Do not use harsh phrases such as "wrong", "poor", "weak", "failed", or "you do not understand"; use "not quite complete", "consider adding", or "a clearer approach would be" instead.
5. Judge the answer, not the student's intelligence or potential.
6. Keep the score objective, but make the written feedback encouraging and useful.
7. Score out of 100 based on technical accuracy, completeness, and clarity.
8. Summary: A 1-2 sentence teacher-style explanation of the answer's progress.
9. Strengths: Bullet points highlighting what the student explained well.
10. Improvements: Bullet points phrased as supportive coaching suggestions, including the missing expected points or corrections.
11. Ideal Answer: Provide a concise, comprehensive model answer that the student can learn from.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
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

  const prompt = `You are a supportive technical teacher reviewing a student's full technical interview practice session.

Candidate Profile:
- Role: ${role}
- Level: ${experienceLevel}

Interview Summary Data:
${evaluationsText}

Provide an overall learning-focused review:
1. Score (0-100): Aggregated performance score. Keep this objective.
2. Summary: Explain the student's progress and readiness in a warm, encouraging teacher voice.
3. Strengths: Top 3-5 skills or ideas the student demonstrated well.
4. Improvements: Top 3-5 areas to practice next. Phrase each as a clear, supportive coaching step rather than a judgment.
5. Recommended Topics: List 3-5 specific technical topics or tools to study further.
6. Always balance corrections with encouragement. Never shame, insult, dismiss, or label the student, and avoid harsh phrases such as "wrong", "poor", "weak", "failed", or "you do not understand".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
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
