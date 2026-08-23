import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { signOut } from '../../services/auth';
import FormContainer from '../../components/FormContainer/FormContainer';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import { enterFullscreen } from '../../services/fullscreen';
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

const experienceOptions = [
  { value: 'fresher', label: 'Fresher', description: 'Build your foundations' },
  { value: 'junior', label: 'Junior', description: 'Grow practical confidence' },
  { value: 'mid', label: 'Mid-level', description: 'Sharpen your decisions' },
  { value: 'senior', label: 'Senior', description: 'Lead with depth' },
];

const difficultyOptions = [
  { value: 'easy', label: 'Easy', description: 'Warm up and build momentum' },
  { value: 'medium', label: 'Medium', description: 'A balanced challenge' },
  { value: 'hard', label: 'Hard', description: 'Test your edge' },
];

const questionPresets = [5, 10, 15];

const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InterviewSetupForm>(initialForm);
  const [questionCountInput, setQuestionCountInput] = useState<string>(String(initialForm.questionCount));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    if (name === 'questionCount') {
      const digits = value.replace(/\D/g, '').slice(0, 2);

      if (value === '') {
        setQuestionCountInput('');
        return;
      }

      const nextValue = Math.min(Number(digits), 30);
      setQuestionCountInput(String(nextValue));

      setFormData((prev) => ({
        ...prev,
        questionCount: nextValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    void enterFullscreen();
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
      <div className="setup-topbar">
        <div className="setup-page-brand" aria-label="InterviewHub AI home">
          <span className="setup-brand-mark">IH</span>
          <span>InterviewHub <em>AI</em></span>
        </div>
        <div className="setup-header">
          <Button variant="secondary" onClick={() => navigate('/')}>Home</Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Dashboard</Button>
          <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
        </div>
      </div>
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

          <fieldset className="setup-choice-group">
            <legend>Experience level</legend>
            <div className="setup-choice-grid setup-choice-grid-levels">
              {experienceOptions.map((option) => (
                <button className={`setup-choice ${formData.experienceLevel === option.value ? 'is-selected' : ''}`} type="button" key={option.value} onClick={() => setFormData((prev) => ({ ...prev, experienceLevel: option.value }))} aria-pressed={formData.experienceLevel === option.value}>
                  <span className="choice-check" aria-hidden="true">{formData.experienceLevel === option.value ? '✓' : ''}</span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <Input
            label="Skills / Technologies"
            name="skills"
            placeholder="React, TypeScript, Node.js"
            value={formData.skills}
            onChange={handleChange}
          />

          <fieldset className="setup-choice-group">
            <legend>Difficulty</legend>
            <div className="setup-choice-grid setup-choice-grid-difficulty">
              {difficultyOptions.map((option) => (
                <button className={`setup-choice ${formData.difficulty === option.value ? 'is-selected' : ''}`} type="button" key={option.value} onClick={() => setFormData((prev) => ({ ...prev, difficulty: option.value }))} aria-pressed={formData.difficulty === option.value}>
                  <span className="choice-check" aria-hidden="true">{formData.difficulty === option.value ? '✓' : ''}</span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="setup-field-group">
            <label className="input-label" htmlFor="questionCount">Number of questions</label>
            <div className="question-count-row">
              <div className="question-presets" aria-label="Question count presets">
                {questionPresets.map((count) => <button className={`question-preset ${formData.questionCount === count ? 'is-selected' : ''}`} type="button" key={count} onClick={() => setFormData((prev) => ({ ...prev, questionCount: count }))} aria-pressed={formData.questionCount === count}>{count}</button>)}
              </div>
              <input
                id="questionCount"
                name="questionCount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min={1}
                max={30}
                value={questionCountInput}
                onChange={handleChange}
                className="number-field"
                aria-label="Custom number of questions"
              />
            </div>
            <p className="setup-field-hint">Choose a quick length or enter any number from 1 to 30.</p>
          </div>

          <aside className="setup-summary" aria-live="polite">
            <div className="summary-kicker"><span className="summary-pulse" /> Your session plan</div>
            <strong>{formData.role.trim() || 'Your target role'}</strong>
            <span>{formData.experienceLevel} <i /> {formData.difficulty} <i /> {formData.questionCount} questions</span>
          </aside>
        </form>
      </FormContainer>
    </div>
  );
};

export default InterviewSetupPage;
