import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import { getAccessToken, signOut } from '../../services/auth';
import './Header.scss';

interface HeaderProps {
    onBenefitsClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    onHowItWorksClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    showDashboard?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onBenefitsClick, onHowItWorksClick, showDashboard = false }) => {
    const navigate = useNavigate();
    const isSignedIn = Boolean(getAccessToken());
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent): void => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    return (
        <div className="landing-header container">
            <Link className="brand" to="/" aria-label="InterviewHub AI home">
                <span className="brand-mark">IH</span>
                <span>InterviewHub <em>AI</em></span>
            </Link>
            <nav className="landing-nav" aria-label="Main navigation">
                <a href="#benefits" onClick={onBenefitsClick}>Why InterviewHub</a>
                <a href="#how-it-works" onClick={onHowItWorksClick}>How it works</a>
                <Button onClick={() => navigate(isSignedIn ? '/setup' : '/register')}>Start practicing</Button>
                {isSignedIn ? <div className={`landing-auth-menu ${isMenuOpen ? 'is-open' : ''}`} ref={menuRef}>
                    <button
                        className="landing-auth-trigger"
                        type="button"
                        aria-label="Account menu"
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((open) => !open)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                    </button>
                    {isMenuOpen && <div className="landing-auth-popover" role="menu" aria-label="Account menu">
                        <button type="button" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}>Dashboard</button>
                        <button type="button" onClick={() => { setIsMenuOpen(false); void signOut(); }}>Sign out</button>
                    </div>}
                </div> : <Link to="/login">Sign in</Link>}
            </nav>
        </div>
    );
};

export default Header;
