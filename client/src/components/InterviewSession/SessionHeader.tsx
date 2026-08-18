import React from 'react';

interface SessionHeaderProps {
  role: string;
  experienceLevel: string;
  difficulty: string;
  remainingSeconds: number | null;
  formatTime: (totalSeconds: number | null) => string;
  isTimerWarning: boolean;
  isTimerCritical: boolean;
  isFinishing: boolean;
  onFinish: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  role,
  experienceLevel,
  difficulty,
  remainingSeconds,
  formatTime,
  isTimerWarning,
  isTimerCritical,
  isFinishing,
  onFinish,
}) => {
  return (
    <header className="session-header">
      <div className="header-meta">
        <h1 className="role-title">{role}</h1>
        <div className="meta-badges">
          <span className="badge badge-level">{experienceLevel}</span>
          <span className="badge badge-difficulty">{difficulty}</span>
        </div>
      </div>

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

      <button onClick={onFinish} className="btn-finish" disabled={isFinishing}>
        Finish Interview
      </button>
    </header>
  );
};

export default SessionHeader;
