import React from 'react';
import './Button.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Reusable Button Component
 * @param {string} children - Button text or content
 * @param {string} variant - Button variant: 'primary', 'secondary'
 * @param {boolean} fullWidth - Make button full width
 * @param {boolean} disabled - Disable button
 * @param {React.ReactNode} icon - Icon element (optional)
 * @param {function} onClick - Click handler
 * @param {string} className - Additional custom classes
 * @param {string} type - Button type: 'button', 'submit', 'reset'
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  icon = null,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const buttonClasses = [
    'button',
    variant,
    fullWidth && 'full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
};

export default Button;
