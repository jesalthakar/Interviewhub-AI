import React from 'react';

import type { Question } from '../../hooks/useInterviewSession';

interface QuestionProgressProps {
  currentIndex: number;
  questions: Question[];
  answeredCount: number;
  skippedCount: number;
  onSelectQuestion: (index: number) => void;
}

const QuestionProgress: React.FC<QuestionProgressProps> = ({
  currentIndex,
  questions,
  answeredCount,
  skippedCount,
  onSelectQuestion,
}) => {
  return (
    <div className="progress-container">
      <div className="progress-summary">
        <span>
          Question <strong>{currentIndex + 1}</strong> of {questions.length}
        </span>
        <span className="progress-counts">
          <span className="dot dot-answered" /> {answeredCount} Answered &nbsp;|&nbsp;
          <span className="dot dot-skipped" /> {skippedCount} Skipped
        </span>
      </div>

      <div className="checkpoint-track">
        {questions.map((question, index) => {
          const statusClass = `status-${question.status}`;
          const isActive = index === currentIndex;

          return (
            <button
              key={question._id || index}
              onClick={() => onSelectQuestion(index)}
              className={`checkpoint-btn ${statusClass} ${isActive ? 'active' : ''}`}
              title={`Question ${index + 1}: ${question.category} (${question.status})`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionProgress;
