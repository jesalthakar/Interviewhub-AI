import React, { useEffect, useRef } from 'react';
import './ConfirmModal.scss';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  isProcessing = false,
  onCancel,
  onConfirm,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div className="confirm-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isProcessing) onCancel();
    }}>
      <div className={`confirm-modal-generic confirm-modal-${tone}`} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-message">
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button ref={cancelButtonRef} type="button" onClick={onCancel} disabled={isProcessing}>{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={isProcessing}>{isProcessing ? 'Please wait...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
