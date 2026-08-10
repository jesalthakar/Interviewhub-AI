import React from 'react';
import './Input.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | null;
  success?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
  hint?: string | null;
  className?: string;
}

/**
 * Reusable Input Component
 * @param {string} label - Input label text
 * @param {string} name - Input name attribute
 * @param {string} type - Input type: 'text', 'email', 'password', etc.
 * @param {string} placeholder - Input placeholder text
 * @param {string | number} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message to display
 * @param {boolean} success - Show success state
 * @param {boolean} disabled - Disable input
 * @param {React.ReactNode} icon - Icon element (optional)
 * @param {string} hint - Hint text below input
 * @param {string} className - Additional custom classes
 */
const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error = null,
  success = false,
  disabled = false,
  icon = null,
  tooltip,
  hint = null,
  className = '',
  ...props
}) => {
  const inputClasses = [
    'input-field',
    error && 'error',
    success && 'success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={name}>
          {label}
        </label>
      )}

      <div className={`input-wrapper ${tooltip ? 'has-tooltip' : ''}`.trim()}>
        <input
          className={inputClasses}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {icon && <div className="input-icon">{icon}</div>}
        {tooltip && (
          <span className="input-tooltip" tabIndex={0} aria-label="Password requirements">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
            <span className="tooltip-content" role="tooltip">{tooltip}</span>
          </span>
        )}
      </div>

      {error && <p className="input-error">{error}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
    </div>
  );
};

export default Input;
