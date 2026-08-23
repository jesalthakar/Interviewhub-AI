import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import axios, { signOut } from '../../services/auth';
import { enterFullscreen } from '../../services/fullscreen';
import './DashboardPage.scss';

type Interview = {
    _id: string;
    role: string;
    experienceLevel: string;
    skills: string[];
    difficulty: string;
    status: 'draft' | 'in_progress' | 'completed' | 'abandoned';
    questionCount: number;
    evaluationStatus: string;
    overallFeedback?: { score?: number };
    completedAt?: string;
    updatedAt: string;
};

const formatDate = (date?: string): string => {
    if (!date) return 'In progress';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
};

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadInterviews = async (): Promise<void> => {
            try {
                const { data } = await axios.get<{ interviews: Interview[] }>('/api/interviews');
                setInterviews(data.interviews);
            } catch {
                setErrorMessage('Unable to load your interview history. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadInterviews();
    }, []);

    const completedInterviews = interviews.filter((interview) => interview.status === 'completed');
    const scoredInterviews = completedInterviews.filter((interview) => typeof interview.overallFeedback?.score === 'number');
    const averageScore = scoredInterviews.length
        ? Math.round(scoredInterviews.reduce((total, interview) => total + (interview.overallFeedback?.score || 0), 0) / scoredInterviews.length)
        : 0;
    const bestScore = scoredInterviews.length
        ? Math.max(...scoredInterviews.map((interview) => interview.overallFeedback?.score || 0))
        : 0;

    const handleDeleteInterview = async (): Promise<void> => {
        if (!interviewToDelete || isDeleting) return;

        setIsDeleting(true);
        try {
            await axios.delete(`/api/interviews/${interviewToDelete._id}`);
            setInterviews((previous) => previous.filter((interview) => interview._id !== interviewToDelete._id));
            setInterviewToDelete(null);
        } catch {
            setErrorMessage('Unable to delete this interview. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <span className="dashboard-brand-mark">IH</span>
                    <span>InterviewHub <em>AI</em></span>
                </div>
                <div className="dashboard-header-actions">
                    <Button variant="secondary" onClick={() => navigate('/')}>Home</Button>
                    <Button variant="secondary" onClick={() => void signOut()}>Sign out</Button>
                    <Button onClick={() => navigate('/setup')}>New interview</Button>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="dashboard-intro">
                    <div>
                        <p className="dashboard-eyebrow">Your practice room</p>
                        <h1>Keep getting <strong>better.</strong></h1>
                        <p>Review your progress and choose your next challenge.</p>
                    </div>
                </div>

                {errorMessage && <p className="dashboard-message dashboard-message-error" role="alert">{errorMessage}</p>}

                <section className="dashboard-stats" aria-label="Interview performance summary">
                    <article><span>Completed interviews</span><strong>{completedInterviews.length}</strong><small>Practice sessions finished</small></article>
                    <article><span>Average score</span><strong>{scoredInterviews.length ? `${averageScore}%` : '--'}</strong><small>{scoredInterviews.length ? 'Across evaluated sessions' : 'Complete an interview to score'}</small></article>
                    <article><span>Best performance</span><strong>{scoredInterviews.length ? `${bestScore}%` : '--'}</strong><small>Highest overall score</small></article>
                </section>

                <section className="history-section">
                    <div className="section-heading"><div><p className="dashboard-eyebrow">Your history</p><h2>Recent interviews</h2></div><span>{interviews.length} total</span></div>
                    {isLoading ? <div className="dashboard-empty">Loading your interviews...</div> : interviews.length === 0 ? <div className="dashboard-empty"><h3>Your first session starts here.</h3><p>Set a target role and practice with personalized AI questions.</p><Button onClick={() => navigate('/setup')}>Start your first interview</Button></div> : <div className="interview-list">
                        {interviews.map((interview) => <article className={`interview-card interview-card-${interview.status}`} key={interview._id}>
                            <div className="interview-card-status"><span className={`status-dot status-${interview.status}`} /><span>{interview.status === 'completed' ? 'Completed' : interview.status === 'in_progress' ? 'In progress' : interview.status === 'abandoned' ? 'Abandoned' : 'Not started'}</span></div>
                            <h3>{interview.role}</h3>
                            <div className="interview-card-details"><div><span>Level</span><strong>{interview.experienceLevel}</strong></div><div><span>Difficulty</span><strong>{interview.difficulty}</strong></div><div><span>Questions</span><strong>{interview.questionCount}</strong></div><div className="interview-card-result">{interview.status === 'completed' && typeof interview.overallFeedback?.score === 'number' ? <strong>{interview.overallFeedback.score}%</strong> : <strong className="score-muted">{interview.status === 'in_progress' ? 'In progress' : 'Not scored'}</strong>}<small>{formatDate(interview.completedAt || interview.updatedAt)}</small></div></div>
                            <div className="interview-card-actions"><Button variant="secondary" onClick={() => { if (interview.status === 'in_progress') void enterFullscreen(); navigate(interview.status === 'in_progress' ? `/interviews/${interview._id}/session` : `/interviews/${interview._id}/results`); }}>{interview.status === 'in_progress' ? 'Resume interview' : 'Review performance'}</Button><button className="interview-card-delete" type="button" aria-label={`Delete ${interview.role} interview`} title="Delete interview" onClick={() => setInterviewToDelete(interview)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></svg></button></div>
                        </article>)}
                    </div>}
                </section>
            </div>
            {interviewToDelete && <ConfirmModal title="Delete interview?" message={`This will permanently remove your ${interviewToDelete.role} interview and its feedback.`} confirmLabel="Delete interview" tone="danger" isProcessing={isDeleting} onCancel={() => setInterviewToDelete(null)} onConfirm={() => void handleDeleteInterview()} />}
        </main>
    );
};

export default DashboardPage;
