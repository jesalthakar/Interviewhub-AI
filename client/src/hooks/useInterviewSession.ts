import { useCallback, useEffect, useState } from 'react';
import axios from '../services/auth';
import { useNavigate, useParams } from 'react-router-dom';

export type QuestionStatus = 'pending' | 'answered' | 'skipped';

export interface Question {
  _id: string;
  order: number;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPoints: string[];
  status: QuestionStatus;
  answer?: {
    text: string;
    submittedAt?: string;
    durationSeconds?: number;
  };
}

export interface Interview {
  _id: string;
  role: string;
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior';
  skills: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  durationMinutes: number;
  status: 'draft' | 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  questions: Question[];
  startedAt: string;
}

const getAuthHeader = () => ({})

const getNextAvailableIndex = (questions: Question[], fromIndex: number): number => {
  for (let i = fromIndex + 1; i < questions.length; i++) {
    if (questions[i].status === 'pending') return i;
  }

  for (let i = 0; i < fromIndex; i++) {
    if (questions[i].status === 'pending') return i;
  }

  for (let i = fromIndex + 1; i < questions.length; i++) {
    if (questions[i].status === 'skipped') return i;
  }

  for (let i = 0; i < fromIndex; i++) {
    if (questions[i].status === 'skipped') return i;
  }

  return fromIndex;
};

export const useInterviewSession = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fetchInterview = useCallback(async () => {
    if (!interviewId) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data } = await axios.get<{ interview: Interview }>(`/api/interviews/${interviewId}`, {
        headers: getAuthHeader(),
      });

      const fetchedInterview = data.interview;

      if (fetchedInterview.status === 'completed' || fetchedInterview.status === 'abandoned') {
        navigate(`/interviews/${interviewId}/results`);
        return;
      }

      setInterview(fetchedInterview);

      let targetIndex = fetchedInterview.currentQuestionIndex || 0;
      if (targetIndex >= fetchedInterview.questions.length) {
        const firstAvailable = fetchedInterview.questions.findIndex(
          (question) => question.status === 'pending' || question.status === 'skipped'
        );
        targetIndex = firstAvailable !== -1 ? firstAvailable : 0;
      }

      setCurrentIndex(targetIndex);
      const currentQuestion = fetchedInterview.questions[targetIndex];
      setAnswerText(currentQuestion?.answer?.text || '');
    } catch (err) {
      const nextError = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : 'Failed to load interview session.';

      setErrorMessage(nextError || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [interviewId, navigate]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  const currentQuestion = interview?.questions[currentIndex] ?? null;
  const isAnswered = currentQuestion?.status === 'answered';
  const answeredCount = interview?.questions.filter((question) => question.status === 'answered').length ?? 0;
  const skippedCount = interview?.questions.filter((question) => question.status === 'skipped').length ?? 0;
  const isReviewingSkipped =
    !!interview &&
    interview.questions.every(
      (question) => question.status === 'answered' || question.status === 'skipped'
    ) &&
    skippedCount > 0;
  const isMinCharMet = answerText.trim().length >= 50;

  const handleSelectQuestion = useCallback(
    (index: number) => {
      if (!interview || isSubmitting) return;

      setCurrentIndex(index);
      const selectedQuestion = interview.questions[index];
      setAnswerText(selectedQuestion?.answer?.text || '');
    },
    [interview, isSubmitting]
  );

  const handleSubmitAnswer = useCallback(async () => {
    if (!interview || isSubmitting) return;

    const activeQuestion = interview.questions[currentIndex];
    if (!activeQuestion) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data } = await axios.post<{
        message: string;
        question: Question;
        currentQuestionIndex: number;
      }>(
        `/api/interviews/${interview._id}/questions/${currentIndex}/answer`,
        { text: answerText, durationSeconds: 0 },
        { headers: getAuthHeader() }
      );

      const updatedQuestions = [...interview.questions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        status: 'answered',
        answer: data.question.answer,
      };

      const nextIndex = getNextAvailableIndex(updatedQuestions, currentIndex);

      setInterview((previous) =>
        previous
          ? {
              ...previous,
              currentQuestionIndex: nextIndex,
              questions: updatedQuestions,
            }
          : null
      );

      setCurrentIndex(nextIndex);
      setAnswerText(updatedQuestions[nextIndex]?.answer?.text || '');
    } catch (err) {
      const nextError = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : 'Failed to submit answer. Please try again.';

      setErrorMessage(nextError || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answerText, currentIndex, interview, isSubmitting]);

  const handleSkipQuestion = useCallback(() => {
    if (!interview || isSubmitting) return;

    const updatedQuestions = [...interview.questions];
    if (updatedQuestions[currentIndex].status !== 'answered') {
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        status: 'skipped',
      };
    }

    const nextIndex = getNextAvailableIndex(updatedQuestions, currentIndex);

    setInterview((previous) =>
      previous ? { ...previous, questions: updatedQuestions } : null
    );

    setCurrentIndex(nextIndex);
    setAnswerText(updatedQuestions[nextIndex]?.answer?.text || '');
  }, [currentIndex, interview, isSubmitting]);

  const executeFinishInterview = useCallback(async () => {
    if (!interview || isFinishing) return;

    setIsFinishing(true);
    setErrorMessage(null);

    try {
      if (answerText.trim().length > 0 && interview.questions[currentIndex]?.status !== 'answered') {
        try {
          await axios.post(
            `/api/interviews/${interview._id}/questions/${currentIndex}/answer`,
            { text: answerText.trim(), durationSeconds: 0 },
            { headers: getAuthHeader() }
          );
        } catch {
          // Continue even if last auto-submit fails.
        }
      }

      await axios.patch(`/api/interviews/${interview._id}/finish`, {}, { headers: getAuthHeader() });
      navigate(`/interviews/${interview._id}/results`);
    } catch (err) {
      const nextError = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : 'Failed to finish interview.';

      setErrorMessage(nextError || 'An error occurred.');
      setIsFinishing(false);
    }
  }, [answerText, currentIndex, interview, isFinishing, navigate]);

  return {
    interview,
    currentIndex,
    currentQuestion,
    answerText,
    setAnswerText,
    isLoading,
    isSubmitting,
    isFinishing,
    errorMessage,
    showConfirmModal,
    setShowConfirmModal,
    isAnswered,
    answeredCount,
    skippedCount,
    isReviewingSkipped,
    isMinCharMet,
    handleSelectQuestion,
    handleSubmitAnswer,
    handleSkipQuestion,
    executeFinishInterview,
  };
};
