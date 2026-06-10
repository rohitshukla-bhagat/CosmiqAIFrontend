import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  user: any;
  onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = location.pathname;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : 'auto';
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMenuOpen) {
      toggleMenu();
    }
  };

  return (
    <>
      <header className={isScrolled ? 'scrolled' : ''}>
        <div className="header-inner">
          <div className="header-brand" onClick={() => handleNavClick('/')} style={{ cursor: 'pointer' }}>
            <span className="font-display-lg text-headline-sm text-primary-fixed-dim tracking-tighter">
              <img src="/CosmiqAI.png" alt="CosmiqAI Logo" style={{ height: '65px', marginRight: '8px' }} />
            </span>
          </div>

          <nav className="nav-desktop">
            <Link 
              className={`nav-link ${currentPage === '/' ? 'active' : ''}`} 
              to="/"
            >
              Home
            </Link>
            <Link 
              className={`nav-link ${currentPage === '/analyzer' ? 'active' : ''}`} 
              to="/analyzer"
            >
              Sky Analyzer
            </Link>
            <Link 
              className={`nav-link ${currentPage === '/chat' ? 'active' : ''}`} 
              to="/chat"
            >
              AI Chat
            </Link>
            <Link 
              className={`nav-link ${currentPage === '/nightsky' ? 'active' : ''}`} 
              to="/nightsky"
            >
              Night Sky
            </Link>
            <Link 
              className={`nav-link ${currentPage === '/nasafeed' ? 'active' : ''}`} 
              to="/nasafeed"
            >
              NASA Feed
            </Link>
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="header-user-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="user-email font-body-md text-on-surface-variant hidden md:inline" style={{ fontSize: '14px' }}>
                  {user.email}
                </span>
                <button className="btn-outline hidden sm:block" onClick={onSignOut} style={{ padding: '0.5rem 1rem', fontSize: '12px' }}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="btn-primary hidden sm:block" onClick={() => handleNavClick('/signin')}>
                Explore Now
              </button>
            )}
            <button className="menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <button className="mobile-menu-close" onClick={toggleMenu}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <Link 
          className={`mobile-nav-link ${currentPage === '/' ? 'active' : ''}`} 
          to="/"
          onClick={() => toggleMenu()}
        >
          Home
        </Link>
        <Link 
          className={`mobile-nav-link ${currentPage === '/analyzer' ? 'active' : ''}`} 
          to="/analyzer"
          onClick={() => toggleMenu()}
        >
          Sky Analyzer
        </Link>
        <Link 
          className={`mobile-nav-link ${currentPage === '/chat' ? 'active' : ''}`} 
          to="/chat"
          onClick={() => toggleMenu()}
        >
          AI Chat
        </Link>
        <Link 
          className={`mobile-nav-link ${currentPage === '/nightsky' ? 'active' : ''}`} 
          to="/nightsky"
          onClick={() => toggleMenu()}
        >
          Night Sky
        </Link>
        <Link 
          className={`mobile-nav-link ${currentPage === '/nasafeed' ? 'active' : ''}`} 
          to="/nasafeed"
          onClick={() => toggleMenu()}
        >
          NASA Feed
        </Link>
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <span className="font-body-md text-on-surface-variant" style={{ fontSize: '16px' }}>
              {user.email}
            </span>
            <button className="btn-outline" onClick={() => { onSignOut(); if (isMenuOpen) toggleMenu(); }} style={{ padding: '1rem 2.5rem' }}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => handleNavClick('/signin')}>
            Explore Now
          </button>
        )}
      </div>
    </>
  );
};

export default Header;

