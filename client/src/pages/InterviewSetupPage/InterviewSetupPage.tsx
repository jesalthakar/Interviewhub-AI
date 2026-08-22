import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { signOut } from '../../services/auth';
import FormContainer from '../../components/FormContainer/FormContainer';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Dropdown from '../../components/Dropdown/Dropdown';
import './InterviewSetupPage.scss';

interface InterviewSetupForm {
  role: string;
  experienceLevel: string;
  skills: string;
  difficulty: string;
  questionCount: number;
}

const initialForm: InterviewSetupForm = {
  role: '',
  experienceLevel: 'mid',
  skills: '',
  difficulty: 'medium',
  questionCount: 5,
};

const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InterviewSetupForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'questionCount' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const skills = formData.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!formData.role.trim()) {
      setErrorMessage('Role is required.');
      return;
    }

    if (skills.length === 0) {
      setErrorMessage('Please enter at least one skill or technology.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payloadExperienceLevel = formData.experienceLevel.toLowerCase();
      const payloadDifficulty = formData.difficulty.toLowerCase();

      const { data } = await axios.post('/api/interviews', {
        role: formData.role.trim(),
        experienceLevel: payloadExperienceLevel,
        skills,
        difficulty: payloadDifficulty,
        questionCount: formData.questionCount,
      });

      const interviewId = data.interview?._id;
      if (interviewId) {
        navigate(`/interviews/${interviewId}/session`);
        return;
      }

      setErrorMessage('Interview was created but no session ID was returned.');
    } catch (error) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : 'Unable to create interview.';

      setErrorMessage(message || 'Unable to create interview.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="interview-setup-page">
      <div className="setup-header"><Button variant="secondary" onClick={() => navigate('/dashboard')}>Dashboard</Button><Button variant="secondary" onClick={() => void signOut()}>Sign out</Button></div>
      <FormContainer
        title="Create Your Interview"
        subtitle="Tell us about your target role so we can generate a personalized interview."
        className="setup-form-container"
        actions={
          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting} form="setup-form">
            {isSubmitting ? 'Creating Interview...' : 'Start Interview'}
          </Button>
        }
      >
        <form id="setup-form" onSubmit={handleSubmit} className="setup-form">
          {errorMessage && <p className="form-message form-message-error">{errorMessage}</p>}

          <Input
            label="Target Role"
            name="role"
            placeholder="Frontend Engineer"
            value={formData.role}
            onChange={handleChange}
          />

          <Dropdown
            label="Experience Level"
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleChange}
            options={[
              { label: 'Fresher', value: 'fresher' },
              { label: 'Junior', value: 'junior' },
              { label: 'Mid', value: 'mid' },
              { label: 'Senior', value: 'senior' },
            ]}
          />

          <Input
            label="Skills / Technologies"
            name="skills"
            placeholder="React, TypeScript, Node.js"
            value={formData.skills}
            onChange={handleChange}
          />

          <Dropdown
            label="Difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            options={[
              { label: 'Easy', value: 'easy' },
              { label: 'Medium', value: 'medium' },
              { label: 'Hard', value: 'hard' },
            ]}
          />

          <div className="setup-field-group">
            <label className="input-label" htmlFor="questionCount">
              Number of Questions
            </label>
            <input
              id="questionCount"
              name="questionCount"
              type="number"
              min={1}
              max={30}
              value={formData.questionCount}
              onChange={handleChange}
              className="number-field"
            />
          </div>
        </form>
      </FormContainer>
    </div>
  );
};

export default InterviewSetupPage;
