import React from 'react';
import './Dropdown.scss';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  name: string;
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  error?: string | null;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  name,
  value,
  options,
  placeholder,
  error = null,
  className = '',
  ...props
}) => {
  const selectClassName = ['dropdown-field', error && 'error', className].filter(Boolean).join(' ');

  return (
    <div className="dropdown-group">
      {label && (
        <label className="dropdown-label" htmlFor={name}>
          {label}
        </label>
      )}

      <select id={name} name={name} value={value} className={selectClassName} {...props}>
        {placeholder && !value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="dropdown-error">{error}</p>}
    </div>
  );
};

export default Dropdown;
