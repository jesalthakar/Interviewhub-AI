import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InterviewSessionPage.scss';

// ==========================================
// TYPES & INTERFACES
// ==========================================
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

// ==========================================
// COMPONENT
// ==========================================
const InterviewSessionPage: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State Management
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  
  // Loading & Action States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Helper to fetch auth token
  const getAuthHeader = () => {
    const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth');
    if (!authData) return {};
    try {
      const parsed = JSON.parse(authData);
      return { Authorization: `Bearer ${parsed.token}` };
    } catch {
      return {};
    }
  };

  // ------------------------------------------
  // 1. FETCH INTERVIEW DATA (On Mount / Refresh)
  // ------------------------------------------
  const fetchInterview = useCallback(async () => {
    if (!interviewId) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data } = await axios.get<{ interview: Interview }>(
        `/api/interviews/${interviewId}`,
        { headers: getAuthHeader() }
      );

      const fetchedInterview = data.interview;

      if (fetchedInterview.status === 'completed' || fetchedInterview.status === 'abandoned') {
        navigate(`/interviews/${interviewId}/results`);
        return;
      }

      setInterview(fetchedInterview);

      // Determine initial current question index
      let targetIndex = fetchedInterview.currentQuestionIndex || 0;
      if (targetIndex >= fetchedInterview.questions.length) {
        // Look for first skipped or pending
        const firstAvailable = fetchedInterview.questions.findIndex(
          (q) => q.status === 'pending' || q.status === 'skipped'
        );
        targetIndex = firstAvailable !== -1 ? firstAvailable : 0;
      }
      setCurrentIndex(targetIndex);

      // Initialize text box with existing answer if available
      const currentQ = fetchedInterview.questions[targetIndex];
      setAnswerText(currentQ?.answer?.text || '');
    } catch (err) {
      const msg = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : 'Failed to load interview session.';
      setErrorMessage(msg || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [interviewId, navigate]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  // ------------------------------------------
  // 2. OVERALL COUNTDOWN TIMER (Server-synced)
  // ------------------------------------------
  useEffect(() => {
    if (!interview || !interview.startedAt || !interview.durationMinutes) return;

    const calculateTimeLeft = () => {
      const startTime = new Date(interview.startedAt).getTime();
      const totalAllowedMs = interview.durationMinutes * 60 * 1000;
      const now = new Date().getTime();
      const elapsed = now - startTime;
      const remainingMs = Math.max(0, totalAllowedMs - elapsed);
      return Math.floor(remainingMs / 1000);
    };

    setRemainingSeconds(calculateTimeLeft());

    const timerInterval = setInterval(() => {
      const secondsLeft = calculateTimeLeft();
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        handleTimerExpired();
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [interview]);

  // Format seconds into MM:SS
  const formatTime = (totalSeconds: number | null): string => {
    if (totalSeconds === null) return '--:--';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // ------------------------------------------
  // 3. NAVIGATION BETWEEN QUESTIONS
  // ------------------------------------------
  const handleSelectQuestion = (index: number) => {
    if (!interview || isSubmitting) return;
    setCurrentIndex(index);
    const selectedQ = interview.questions[index];
    setAnswerText(selectedQ?.answer?.text || '');
  };

  // Find next logical index (prioritizing pending, then skipped)
  const getNextAvailableIndex = (fromIndex: number): number => {
    if (!interview) return 0;
    const qList = interview.questions;

    // Search for next pending question
    for (let i = fromIndex + 1; i < qList.length; i++) {
      if (qList[i].status === 'pending') return i;
    }
    for (let i = 0; i < fromIndex; i++) {
      if (qList[i].status === 'pending') return i;
    }

    // If no pending, search for skipped questions
    for (let i = fromIndex + 1; i < qList.length; i++) {
      if (qList[i].status === 'skipped') return i;
    }
    for (let i = 0; i < fromIndex; i++) {
      if (qList[i].status === 'skipped') return i;
    }

    return fromIndex;
  };

  // ------------------------------------------
  // 4. SUBMIT ANSWER
  // ------------------------------------------
  const handleSubmitAnswer = async () => {
    if (!interview || isSubmitting) return;
    const currentQ = interview.questions[currentIndex];
    if (!currentQ) return;

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

      // Update question state in local interview object
      const updatedQuestions = [...interview.questions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        status: 'answered',
        answer: data.question.answer,
      };

      const nextIdx = getNextAvailableIndex(currentIndex);
      
      setInterview((prev) =>
        prev
          ? {
              ...prev,
              currentQuestionIndex: nextIdx,
              questions: updatedQuestions,
            }
          : null
      );

      // Advance to next question
      setCurrentIndex(nextIdx);
      setAnswerText(updatedQuestions[nextIdx]?.answer?.text || '');
    } catch (err) {
      const msg = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : 'Failed to submit answer. Please try again.';
      setErrorMessage(msg || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------
  // 5. SKIP QUESTION
  // ------------------------------------------
  const handleSkipQuestion = () => {
    if (!interview || isSubmitting) return;

    const updatedQuestions = [...interview.questions];
    if (updatedQuestions[currentIndex].status !== 'answered') {
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        status: 'skipped',
      };
    }

    const nextIdx = getNextAvailableIndex(currentIndex);

    setInterview((prev) =>
      prev ? { ...prev, questions: updatedQuestions } : null
    );

    setCurrentIndex(nextIdx);
    setAnswerText(updatedQuestions[nextIdx]?.answer?.text || '');
  };

  // ------------------------------------------
  // 6. FINISH INTERVIEW (Manual or Timer Expired)
  // ------------------------------------------
  const executeFinishInterview = async () => {
    if (!interview || isFinishing) return;
    setIsFinishing(true);
    setErrorMessage(null);

    try {
      // If there's partial text typed in current question, try submitting it first
      if (answerText.trim().length > 0 && interview.questions[currentIndex]?.status !== 'answered') {
        try {
          await axios.post(
            `/api/interviews/${interview._id}/questions/${currentIndex}/answer`,
            { text: answerText.trim(), durationSeconds: 0 },
            { headers: getAuthHeader() }
          );
        } catch {
          // Continue finishing even if last auto-submit fails
        }
      }

      await axios.patch(
        `/api/interviews/${interview._id}/finish`,
        {},
        { headers: getAuthHeader() }
      );

      navigate(`/interviews/${interview._id}/results`);
    } catch (err) {
      const msg = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : 'Failed to finish interview.';
      setErrorMessage(msg || 'An error occurred.');
      setIsFinishing(false);
    }
  };

  const handleTimerExpired = () => {
    executeFinishInterview();
  };

  // ------------------------------------------
  // DERIVED UI VALUES
  // ------------------------------------------
  const currentQuestion = interview?.questions[currentIndex];
  const isAnswered = currentQuestion?.status === 'answered';
  const isMinCharMet = answerText.trim().length >= 50;
  const isTimerWarning = remainingSeconds !== null && remainingSeconds < 300; // < 5 mins
  const isTimerCritical = remainingSeconds !== null && remainingSeconds < 120; // < 2 mins

  const answeredCount = interview?.questions.filter((q) => q.status === 'answered').length || 0;
  const skippedCount = interview?.questions.filter((q) => q.status === 'skipped').length || 0;
  const isReviewingSkipped =
    interview?.questions.every((q) => q.status === 'answered' || q.status === 'skipped') &&
    skippedCount > 0;

  // ------------------------------------------
  // RENDER STATES
  // ------------------------------------------
  if (isLoading) {
    return (
      <div className="session-loading-container">
        <div className="spinner" />
        <p>Loading your interview session...</p>
      </div>
    );
  }

  if (errorMessage && !interview) {
    return (
      <div className="session-error-container">
        <h2>Unable to Load Interview</h2>
        <p>{errorMessage}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!interview || !currentQuestion) return null;

  return (
    <div className="interview-session-page">
      {/* ---------------- HEADER ---------------- */}
      <header className="session-header">
        <div className="header-meta">
          <h1 className="role-title">{interview.role}</h1>
          <div className="meta-badges">
            <span className="badge badge-level">{interview.experienceLevel}</span>
            <span className="badge badge-difficulty">{interview.difficulty}</span>
          </div>
        </div>

        {/* SERVER-SYNCED TIMER */}
        <div
          className={`session-timer ${isTimerWarning ? 'warning' : ''} ${
            isTimerCritical ? 'critical' : ''
          }`}
        >
          <svg className="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" strokeWidth="2" />
          </svg>
          <span className="timer-text">{formatTime(remainingSeconds)}</span>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="btn-finish"
          disabled={isFinishing}
        >
          Finish Interview
        </button>
      </header>

      {/* ---------------- PROGRESS BAR & CHECKPOINTS ---------------- */}
      <div className="progress-container">
        <div className="progress-summary">
          <span>
            Question <strong>{currentIndex + 1}</strong> of {interview.questionCount}
          </span>
          <span className="progress-counts">
            <span className="dot dot-answered" /> {answeredCount} Answered &nbsp;|&nbsp;
            <span className="dot dot-skipped" /> {skippedCount} Skipped
          </span>
        </div>

        <div className="checkpoint-track">
          {interview.questions.map((q, idx) => {
            const isActive = idx === currentIndex;
            const statusClass = `status-${q.status}`;

            return (
              <button
                key={q._id || idx}
                onClick={() => handleSelectQuestion(idx)}
                className={`checkpoint-btn ${statusClass} ${isActive ? 'active' : ''}`}
                title={`Question ${idx + 1}: ${q.category} (${q.status})`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- SKIPPED REVIEW BANNER ---------------- */}
      {isReviewingSkipped && (
        <div className="skipped-review-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path
              d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              strokeWidth="2"
            />
            <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" />
          </svg>
          <span>
            You have answered all initial questions! Reviewing <strong>{skippedCount}</strong> skipped question(s).
          </span>
        </div>
      )}

      {/* ---------------- MAIN QUESTION CARD ---------------- */}
      <main className="question-card">
        {errorMessage && <div className="error-banner">{errorMessage}</div>}

        <div className="card-header">
          <span className="question-number">Question {currentIndex + 1}</span>
          <span className="question-category">{currentQuestion.category}</span>
        </div>

        <h2 className="question-text">{currentQuestion.text}</h2>

        {/* ANSWER TEXTAREA */}
        <div className="answer-section">
          <label htmlFor="answer-input" className="answer-label">
            Your Technical Answer
          </label>
          <textarea
            id="answer-input"
            className="answer-textarea"
            placeholder="Type your response clearly. Include key principles, syntax examples, and trade-offs..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            disabled={isSubmitting || isAnswered}
            rows={8}
            maxLength={3000}
          />

          <div className="textarea-footer">
            <div className="validation-hint">
              {answerText.trim().length === 0 && (
                <span className="hint-neutral">Minimum 50 characters required to submit.</span>
              )}
              {answerText.trim().length > 0 && answerText.trim().length < 50 && (
                <span className="hint-warning">
                  {50 - answerText.trim().length} more characters needed.
                </span>
              )}
              {answerText.trim().length >= 50 && answerText.trim().length < 100 && (
                <span className="hint-info">Concise response. Adding details improves evaluation depth.</span>
              )}
              {answerText.trim().length >= 100 && (
                <span className="hint-success">✓ Good answer length.</span>
              )}
            </div>

            <span className="char-count">{answerText.length} / 3000</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <footer className="card-actions">
          <button
            onClick={handleSkipQuestion}
            className="btn-skip"
            disabled={isSubmitting || isAnswered}
          >
            Skip Question
          </button>

          <button
            onClick={handleSubmitAnswer}
            className="btn-submit"
            disabled={isSubmitting || isAnswered || !isMinCharMet}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-small" /> AI Evaluating...
              </span>
            ) : isAnswered ? (
              'Answer Submitted ✓'
            ) : (
              'Submit Answer'
            )}
          </button>
        </footer>
      </main>

      {/* ---------------- CONFIRM FINISH MODAL ---------------- */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <h3>Finish Interview?</h3>
            <p>
              Are you sure you want to finish your interview session?
            </p>

            <div className="modal-summary">
              <div className="summary-item">
                <span className="count success">{answeredCount}</span>
                <span className="label">Answered</span>
              </div>
              <div className="summary-item">
                <span className="count warning">{skippedCount}</span>
                <span className="label">Skipped</span>
              </div>
              <div className="summary-item">
                <span className="count neutral">
                  {interview.questionCount - (answeredCount + skippedCount)}
                </span>
                <span className="label">Unvisited</span>
              </div>
            </div>

            <p className="modal-note">
              Once finished, your responses will be submitted for final evaluation.
            </p>

            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn-modal-cancel"
                disabled={isFinishing}
              >
                Cancel
              </button>
              <button
                onClick={executeFinishInterview}
                className="btn-modal-confirm"
                disabled={isFinishing}
              >
                {isFinishing ? 'Finishing...' : 'Yes, Finish Interview'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSessionPage;
