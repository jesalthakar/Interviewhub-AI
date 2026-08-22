import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Header.scss';

interface HeaderProps {
    onBenefitsClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onHowItWorksClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ onBenefitsClick, onHowItWorksClick }) => {
    const navigate = useNavigate();

    return (
        <div className="landing-header container">
            <Link className="brand" to="/" aria-label="InterviewHub AI home">
                <span className="brand-mark">IH</span>
                <span>InterviewHub <em>AI</em></span>
            </Link>
            <nav className="landing-nav" aria-label="Main navigation">
                <a href="#benefits" onClick={onBenefitsClick}>Why InterviewHub</a>
                <a href="#how-it-works" onClick={onHowItWorksClick}>How it works</a>
                <Link to="/login">Sign in</Link>
                <Button onClick={() => navigate('/register')}>Start practicing</Button>
            </nav>
        </div>
    );
};

export default Header;
