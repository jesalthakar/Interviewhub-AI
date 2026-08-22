import React from 'react';
import { useNavigate } from 'react-router-dom';

import axios from '../../services/auth';
import FinishConfirmModal from '../../components/InterviewSession/FinishConfirmModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import QuestionCard from '../../components/InterviewSession/QuestionCard';
import QuestionProgress from '../../components/InterviewSession/QuestionProgress';
import SessionHeader from '../../components/InterviewSession/SessionHeader';
import { ErrorState, LoadingState } from '../../components/InterviewSession/StatePanels';
import { useInterviewSession } from '../../hooks/useInterviewSession';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';
import './InterviewSessionPage.scss';

const InterviewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const {
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
  } = useInterviewSession();

  const { remainingSeconds, formatTime, isTimerWarning, isTimerCritical } = useInterviewTimer({
    interview,
    onExpire: executeFinishInterview,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (errorMessage && !interview) {
    return <ErrorState message={errorMessage} onBack={() => navigate('/dashboard')} />;
  }

  if (!interview || !currentQuestion) return null;

  return (
    <div className="interview-session-page">
      <SessionHeader
        role={interview.role}
        experienceLevel={interview.experienceLevel}
        difficulty={interview.difficulty}
        remainingSeconds={remainingSeconds}
        formatTime={formatTime}
        isTimerWarning={isTimerWarning}
        isTimerCritical={isTimerCritical}
        isFinishing={isFinishing}
        onExit={() => setShowExitModal(true)}
        onFinish={() => setShowConfirmModal(true)}
      />

      <QuestionProgress
        currentIndex={currentIndex}
        questions={interview.questions}
        answeredCount={answeredCount}
        skippedCount={skippedCount}
        onSelectQuestion={handleSelectQuestion}
      />

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

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <QuestionCard
        currentQuestion={currentQuestion}
        currentIndex={currentIndex}
        answerText={answerText}
        isSubmitting={isSubmitting}
        isAnswered={isAnswered}
        isMinCharMet={isMinCharMet}
        onAnswerChange={setAnswerText}
        onSubmitAnswer={handleSubmitAnswer}
        onSkipQuestion={handleSkipQuestion}
      />

      {showConfirmModal && (
        <FinishConfirmModal
          answeredCount={answeredCount}
          skippedCount={skippedCount}
          totalQuestions={interview.questionCount}
          isFinishing={isFinishing}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={executeFinishInterview}
        />
      )}

      {showExitModal && (
        <ConfirmModal
          title="Leave interview?"
          message="Your submitted answers will be saved. This interview will remain in progress, and the timer will pause while you are away."
          confirmLabel="Leave interview"
          isProcessing={isExiting}
          onCancel={() => setShowExitModal(false)}
          onConfirm={async () => {
            if (!interview) return;

            try {
              setIsExiting(true);
              await axios.patch(`/api/interviews/${interview._id}/pause`);
              navigate('/dashboard');
            } catch {
              setIsExiting(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default InterviewSessionPage;
