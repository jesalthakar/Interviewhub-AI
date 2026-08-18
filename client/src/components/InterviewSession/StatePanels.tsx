import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading your interview session...' }) => (
  <div className="session-loading-container">
    <div className="spinner" />
    <p>{message}</p>
  </div>
);

interface ErrorStateProps {
  message: string;
  onBack: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onBack }) => (
  <div className="session-error-container">
    <h2>Unable to Load Interview</h2>
    <p>{message}</p>
    <button onClick={onBack} className="btn-primary">
      Return to Dashboard
    </button>
  </div>
);
