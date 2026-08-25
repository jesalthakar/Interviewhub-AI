import React from 'react';

import type { Question } from '../../hooks/useInterviewSession';

interface QuestionCardProps {
  currentQuestion: Question;
  currentIndex: number;
  answerText: string;
  isSubmitting: boolean;
  isAnswered: boolean;
  isMinCharMet: boolean;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onSkipQuestion: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  currentQuestion,
  currentIndex,
  answerText,
  isSubmitting,
  isAnswered,
  isMinCharMet,
  onAnswerChange,
  onSubmitAnswer,
  onSkipQuestion,
}) => {
  const trimmedAnswer = answerText.trim();

  return (
    <main className="question-card">
      <div className="card-header">
        <span className="question-number">Question {currentIndex + 1}</span>
        <span className="question-category">{currentQuestion.category}</span>
      </div>

      <h2 className="question-text">{currentQuestion.text}</h2>

      <div className="answer-section">
        <label htmlFor="answer-input" className="answer-label">
          Your Technical Answer
        </label>
        <textarea
          id="answer-input"
          className="answer-textarea"
          placeholder="Type your response clearly. Include key principles, syntax examples, and trade-offs..."
          value={answerText}
          onChange={(event) => onAnswerChange(event.target.value)}
          onFocus={(event) => {
            const target = event.currentTarget;
            requestAnimationFrame(() => {
              target?.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
              });
            });
          }}
          disabled={isSubmitting || isAnswered}
          rows={8}
          maxLength={3000}
        />

        <div className="textarea-footer">
          <div className="validation-hint">
            {trimmedAnswer.length === 0 && (
              <span className="hint-neutral">Minimum 50 characters required to submit.</span>
            )}
            {trimmedAnswer.length > 0 && trimmedAnswer.length < 50 && (
              <span className="hint-warning">
                {50 - trimmedAnswer.length} more characters needed.
              </span>
            )}
            {trimmedAnswer.length >= 50 && trimmedAnswer.length < 100 && (
              <span className="hint-info">Concise response. Adding details improves evaluation depth.</span>
            )}
            {trimmedAnswer.length >= 100 && (
              <span className="hint-success">✓ Good answer length.</span>
            )}
          </div>

          <span className="char-count">{answerText.length} / 3000</span>
        </div>
      </div>

      <footer className="card-actions">
        <button onClick={onSkipQuestion} className="btn-skip" disabled={isSubmitting || isAnswered}>
          Skip Question
        </button>

        <button
          onClick={onSubmitAnswer}
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
  );
};

export default QuestionCard;
