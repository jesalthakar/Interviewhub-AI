import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import './LandingPage.scss';

const benefits = [
    { number: '01', title: 'Personalized questions', text: 'Build a session around the role, skills, and experience level you are targeting.' },
    { number: '02', title: 'Real interview pressure', text: 'Practice with a timed flow that keeps you moving and makes every answer count.' },
    { number: '03', title: 'Useful AI feedback', text: 'Get clear evaluations after each answer so your next attempt is sharper.' },
];

const steps = [
    ['01', 'Set your target', 'Choose a role, experience level, skills, difficulty, and question count.'],
    ['02', 'Take the interview', 'Answer AI-generated questions in a focused, realistic session.'],
    ['03', 'Improve with feedback', 'See how each answer performed and turn weak spots into a plan.'],
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [benefitAnimationKey, setBenefitAnimationKey] = useState(0);

    const handleBenefitsClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setBenefitAnimationKey((previousKey) => previousKey + 1);
    };

    const handleHowItWorksClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <main className="landing-page">
            <Header onBenefitsClick={handleBenefitsClick} onHowItWorksClick={handleHowItWorksClick} />

            <section className="landing-hero container">
                <div className="hero-copy"><p className="eyebrow"><span /> AI-powered interview practice</p><h1>Walk into your next interview <strong>ready.</strong></h1><p className="hero-description">Practice the questions that matter for your role, sharpen your answers, and build confidence one session at a time.</p><div className="hero-actions"><Button onClick={() => navigate('/register')}>Start practicing <span aria-hidden="true">-&gt;</span></Button><Link className="text-link" to="/login">Already have an account? <strong>Sign in</strong></Link></div><div className="hero-proof"><span className="proof-dot" /> Built for focused practice, not endless scrolling</div></div>
                <div className="hero-preview" aria-label="Interview session preview"><div className="preview-topline"><span>LIVE SESSION</span><span className="preview-timer">24:18</span></div><div className="preview-question"><span className="question-label">QUESTION 03 / 05</span><h2>How would you improve the performance of a React application?</h2></div><div className="preview-answer"><span>Your answer</span><div className="answer-lines"><i /><i /><i /></div></div><div className="preview-footer"><span><b /> AI interviewer is listening</span><span className="preview-arrow">-&gt;</span></div></div>
            </section>

            <section className="benefits-section container" id="benefits"><div className="section-intro"><p className="eyebrow"><span /> The practice advantage</p><h2>Less guessing.<br /><strong>More progress.</strong></h2></div><div className="benefits-grid" key={benefitAnimationKey}>{benefits.map((benefit) => <article className="benefit" key={benefit.number}><span className="benefit-number">{benefit.number}</span><h3>{benefit.title}</h3><p>{benefit.text}</p></article>)}</div></section>

            <section className="steps-section" id="how-it-works"><div className="container"><div className="section-intro"><p className="eyebrow"><span /> Your next session</p><h2>Three steps to a<br /><strong>better interview.</strong></h2></div><div className="steps-grid">{steps.map(([number, title, text]) => <article className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

            <section className="final-cta container"><div><p className="eyebrow"><span /> Start where you are</p><h2>Your next best answer<br /><strong>starts here.</strong></h2></div><Button onClick={() => navigate('/register')}>Create your free account <span aria-hidden="true">-&gt;</span></Button></section>

            <Footer onFeaturesClick={() => setBenefitAnimationKey((previousKey) => previousKey + 1)} />
        </main>
    );
};

export default LandingPage;