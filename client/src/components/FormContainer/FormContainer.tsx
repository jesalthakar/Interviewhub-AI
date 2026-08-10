import React from 'react';
import './FormContainer.scss';

interface FormContainerProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string | null;
  children: React.ReactNode;
  actions?: React.ReactNode;
  links?: React.ReactNode | null;
  footer?: React.ReactNode | null;
  className?: string;
}

/**
 * Reusable FormContainer Component
 * Wrapper for forms with header, content, actions, and footer sections
 * @param {React.ReactNode} icon - Icon element for header
 * @param {string} title - Form title
 * @param {string} subtitle - Form subtitle/description
 * @param {React.ReactNode} children - Form content (inputs, fields, etc.)
 * @param {React.ReactNode} actions - Form action buttons
 * @param {React.ReactNode} links - Navigation links (Register, Forgot Password, etc.)
 * @param {React.ReactNode} footer - Footer content
 * @param {string} className - Additional custom classes
 */
const FormContainer: React.FC<FormContainerProps> = ({
  icon = null,
  title,
  subtitle = null,
  children,
  actions,
  links = null,
  footer = null,
  className = '',
}) => {
  return (
    <div className={`form-container ${className}`.trim()}>
      {(icon || title) && (
        <div className="form-header">
          {icon && <div className="form-icon">{icon}</div>}
          {title && <h1 className="form-title">{title}</h1>}
          {subtitle && <p className="form-subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="form-content">{children}</div>

      {actions && <div className="form-actions">{actions}</div>}

      {links && <div className="form-links">{links}</div>}

      {footer && <div className="form-footer">{footer}</div>}
    </div>
  );
};

export default FormContainer;
