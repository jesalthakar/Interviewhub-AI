import React from 'react';
import { Link } from 'react-router-dom';
import { getAccessToken, signOut } from '../../services/auth';
import './Footer.scss';

interface FooterProps {
    onFeaturesClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onFeaturesClick }) => {
    const isSignedIn = Boolean(getAccessToken());
    const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        const sectionId = event.currentTarget.getAttribute('href')?.slice(1);

        if (sectionId) {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

            if (sectionId === 'benefits') {
                onFeaturesClick?.();
            }
        }
    };

    return (
    <div className="landing-footer container">
        <Link className="brand" to="/" aria-label="InterviewHub AI home">
            <span className="brand-mark">IH</span>
            <span>InterviewHub <em>AI</em></span>
        </Link>
        <p>Practice with purpose.</p>
        <div>
            {isSignedIn ? <button className="footer-auth-link" type="button" onClick={() => void signOut()}>Sign out</button> : <Link to="/login">Sign in</Link>}
            <a href="#benefits" onClick={handleSectionClick}>Features</a>
            <a href="#how-it-works" onClick={handleSectionClick}>How it works</a>
        </div>
    </div>
    );
};

export default Footer;
