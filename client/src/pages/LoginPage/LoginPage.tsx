import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FormContainer from '../../components/FormContainer/FormContainer';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { setAccessToken } from '../../services/auth';
import './LoginPage.scss';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

/**
 * LoginPage Component
 * Displays login form with email and password inputs
 * Pure UI component - no logic implementation yet
 */
const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Placeholder handlers - to be implemented with logic later
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSubmitError('');
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    try {
      setIsSubmitting(true);
      const { data } = await axios.post<LoginResponse>('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      }, { withCredentials: true });

      setAccessToken(data.token);
      setSuccessMessage('Signed in successfully.');
      navigate('/setup');
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setSubmitError(message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <FormContainer
        title="Welcome Back"
        subtitle="Sign in to your account"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        }
        actions={
          <Button
            type="submit"
            variant="primary"
            fullWidth
            form="login-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        }
        links={
          <div className="form-navigation">
            <a href="#forgot-password">Forgot Password?</a>
            <span className="separator">•</span>
            <Link to="/register">Create Account</Link>
          </div>
        }
      >
        <form id="login-form" className="login-form" onSubmit={handleSignIn}>
          {submitError && <p className="form-message form-message-error" role="alert">{submitError}</p>}
          {successMessage && <p className="form-message form-message-success" role="status">{successMessage}</p>}
          <div className="form-fields">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
            />

            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
          </div>
        </form>
      </FormContainer>
    </div>
  );
};

export default LoginPage;
