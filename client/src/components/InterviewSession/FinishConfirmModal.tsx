import React from 'react';

interface FinishConfirmModalProps {
  answeredCount: number;
  skippedCount: number;
  totalQuestions: number;
  isFinishing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const FinishConfirmModal: React.FC<FinishConfirmModalProps> = ({
  answeredCount,
  skippedCount,
  totalQuestions,
  isFinishing,
  onCancel,
  onConfirm,
}) => {
  return (
    <div className="modal-backdrop">
      <div className="confirm-modal">
        <h3>Finish Interview?</h3>
        <p>Are you sure you want to finish your interview session?</p>

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
            <span className="count neutral">{totalQuestions - (answeredCount + skippedCount)}</span>
            <span className="label">Unvisited</span>
          </div>
        </div>

        <p className="modal-note">
          Once finished, your responses will be submitted for final evaluation.
        </p>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn-modal-cancel" disabled={isFinishing}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-modal-confirm" disabled={isFinishing}>
            {isFinishing ? 'Finishing...' : 'Yes, Finish Interview'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinishConfirmModal;
