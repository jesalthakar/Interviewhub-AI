import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button/Button';
import axios from '../../services/auth';
import './InterviewResultsPage.scss';

type QuestionFeedback = {
    score?: number;
    summary?: string;
    strengths?: string[];
    improvements?: string[];
    idealAnswer?: string;
};

type ReviewQuestion = {
    order: number;
    text: string;
    category: string;
    status: 'pending' | 'answered' | 'skipped';
    expectedPoints?: string[];
    answer?: { text?: string };
    feedback?: QuestionFeedback;
};

type InterviewReview = {
    role: string;
    experienceLevel: string;
    difficulty: string;
    questionCount: number;
    completedAt?: string;
    questions: ReviewQuestion[];
    overallFeedback?: {
        score?: number;
        summary?: string;
        strengths?: string[];
        improvements?: string[];
        recommendedTopics?: string[];
    };
};

const formatDate = (date?: string): string => {
    if (!date) return 'Date unavailable';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
};

const StrongerAnswerAccordion: React.FC<{ question: ReviewQuestion }> = ({ question }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentId = `stronger-answer-${question.order}`;

    return (
        <div className={`stronger-answer${isOpen ? ' is-open' : ''}`}>
            <button
                className="stronger-answer-toggle"
                type="button"
                aria-expanded={isOpen}
                aria-controls={contentId}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span>Stronger answer</span>
                <span className="stronger-answer-icon" aria-hidden="true">{isOpen ? '\u2212' : '+'}</span>
            </button>
            <div className="accordion-content" id={contentId} aria-hidden={!isOpen}>
                <div>
                    {question.feedback?.idealAnswer ? <p>{question.feedback.idealAnswer}</p> : <>
                        <p>When you revisit this question, try to include:</p>
                        {question.expectedPoints?.length ? <ul>{question.expectedPoints.map((point) => <li key={point}>{point}</li>)}</ul> : <p>Explain your approach, key trade-offs, and a practical example.</p>}
                    </>}
                </div>
            </div>
        </div>
    );
};

const InterviewResultsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [interview, setInterview] = useState<InterviewReview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const loadReview = async (): Promise<void> => {
            if (!id) return;

            try {
                const { data } = await axios.get<{ interview: InterviewReview }>(`/api/interviews/${id}`);
                setInterview(data.interview);
            } catch {
                setErrorMessage('Unable to load this interview review. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadReview();
    }, [id]);

    if (isLoading) {
        return <main className="results-page"><div className="results-state">Loading your review...</div></main>;
    }

    if (errorMessage || !interview) {
        return (
            <main className="results-page">
                <div className="results-state">
                    <h1>Review unavailable</h1>
                    <p>{errorMessage || 'This interview could not be found.'}</p>
                    <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
                </div>
            </main>
        );
    }

    const answeredQuestions = interview.questions.filter((question) => question.status === 'answered');
    const scoredQuestions = answeredQuestions.filter((question) => typeof question.feedback?.score === 'number');
    const calculatedScore = scoredQuestions.length
        ? Math.round(scoredQuestions.reduce((total, question) => total + (question.feedback?.score || 0), 0) / scoredQuestions.length)
        : null;
    const overallScore = typeof interview.overallFeedback?.score === 'number'
        ? interview.overallFeedback.score
        : calculatedScore;

    return (
        <main className="results-page">
            <header className="results-header">
                <button className="results-brand" type="button" onClick={() => navigate('/dashboard')}>
                    <span className="results-brand-mark">IH</span>
                    <span>InterviewHub <em>AI</em></span>
                </button>
                <div className="results-header-actions"><Button variant="secondary" onClick={() => navigate('/')}>Home</Button><Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to dashboard</Button></div>
            </header>

            <div className="results-content">
                <section className="results-intro">
                    <div>
                        <p className="results-eyebrow">Interview review</p>
                        <h1>{interview.role}</h1>
                        <p className="results-meta">{interview.experienceLevel} <span /> {interview.difficulty} <span /> {formatDate(interview.completedAt)}</p>
                    </div>
                    <div className="overall-score" aria-label={overallScore === null ? 'No overall score' : `Overall score ${overallScore} percent`}>
                        <span>Overall score</span>
                        <div className="score-ring" style={{ '--score-angle': `${(overallScore || 0) * 3.6}deg` } as React.CSSProperties}>
                            <strong>{overallScore === null ? '--' : `${overallScore}%`}</strong>
                        </div>
                    </div>
                </section>

                {interview.overallFeedback && (
                    <section className="overall-feedback" aria-labelledby="overall-feedback-title">
                        <div className="results-section-heading">
                            <p className="results-eyebrow">Final feedback</p>
                            <h2 id="overall-feedback-title">Your performance at a glance</h2>
                        </div>
                        {interview.overallFeedback.summary && <p className="overall-summary">{interview.overallFeedback.summary}</p>}
                        <div className="feedback-columns">
                            {interview.overallFeedback.strengths?.length ? <div className="feedback-panel feedback-panel-strengths"><h3>What went well</h3><ul>{interview.overallFeedback.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul></div> : null}
                            {interview.overallFeedback.improvements?.length ? <div className="feedback-panel feedback-panel-improvements"><h3>What to improve</h3><ul>{interview.overallFeedback.improvements.map((improvement) => <li key={improvement}>{improvement}</li>)}</ul></div> : null}
                            {interview.overallFeedback.recommendedTopics?.length ? <div className="feedback-panel feedback-panel-topics"><h3>Recommended topics</h3><ul>{interview.overallFeedback.recommendedTopics.map((topic) => <li key={topic}>{topic}</li>)}</ul></div> : null}
                        </div>
                    </section>
                )}

                <section className="question-review" aria-labelledby="question-review-title">
                    <div className="results-section-heading">
                        <p className="results-eyebrow">Question breakdown</p>
                        <h2 id="question-review-title">Review each answer</h2>
                    </div>
                    <div className="question-review-list">
                        {interview.questions.map((question) => (
                            <article className={`review-question review-question-${question.status}`} key={question.order}>
                                <div className="review-question-heading">
                                    <span className="question-number">Question {String(question.order).padStart(2, '0')}</span>
                                    <span className="question-category">{question.category}</span>
                                    <span className="question-score">{typeof question.feedback?.score === 'number' ? `${question.feedback.score}%` : question.status === 'skipped' ? 'Skipped' : 'Not scored'}</span>
                                </div>
                                <h3>{question.text}</h3>
                                <div className="answer-block"><span>Your answer</span><p>{question.answer?.text || 'No answer was submitted.'}</p></div>
                                {(question.feedback || question.status === 'skipped') && (
                                    <div className="question-feedback">
                                        {question.feedback?.summary && <div className="feedback-block feedback-block-summary"><h4>Feedback</h4><p>{question.feedback.summary}</p></div>}
                                        {question.feedback?.improvements?.length ? <div className="feedback-block feedback-block-next-step"><h4>Next step</h4><ul>{question.feedback.improvements.map((improvement) => <li key={improvement}>{improvement}</li>)}</ul></div> : null}
                                        <StrongerAnswerAccordion question={question} />
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default InterviewResultsPage;
