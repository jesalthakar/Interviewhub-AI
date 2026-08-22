import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Button from '../../components/Button/Button';
import FormContainer from '../../components/FormContainer/FormContainer';
import Input from '../../components/Input/Input';
import './RegisterPage.scss';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof RegisterFormData, string>>;

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setSubmitError('');
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = 'Enter a valid email address.';
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{9,}$/.test(formData.password)) {
      nextErrors.password = 'Please enter a password.';
    }
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    return nextErrors;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError('');

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await axios.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
      });
      setSuccessMessage('Account created successfully. You can now sign in.');
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setSubmitError(message || 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <FormContainer
        title="Create your account"
        subtitle="Start practicing interviews with AI"
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /><path d="M19 8v6M16 11h6" /></svg>}
        actions={<Button type="submit" variant="primary" fullWidth form="register-form" disabled={isSubmitting || Boolean(successMessage)}>{isSubmitting ? 'Creating account...' : 'Create account'}</Button>}
        links={<div className="register-prompt">Already have an account? <Link to="/login">Sign in</Link></div>}
      >
        <form id="register-form" className="register-form" onSubmit={handleRegister} noValidate>
          <div className="form-fields">
            {submitError && <p className="form-error" role="alert">{submitError}</p>}
            {successMessage && <p className="form-success" role="status">{successMessage}</p>}
            <Input label="Email Address" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} error={errors.email} autoComplete="email" />
            <Input label="Password" name="password" type="password" placeholder="Enter your password" value={formData.password} onChange={handleInputChange} error={errors.password} autoComplete="new-password" tooltip="Strong password: 9+ characters, including an uppercase letter, number, and special character." />
            <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleInputChange} error={errors.confirmPassword} autoComplete="new-password" />
          </div>
        </form>
      </FormContainer>
    </div>
  );
};

export default RegisterPage;
