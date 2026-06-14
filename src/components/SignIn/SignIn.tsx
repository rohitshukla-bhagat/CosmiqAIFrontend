import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import { api } from '../../lib/api.ts';

interface SignInProps {
  onLoginSuccess: (user: any, token: string) => void;
  verificationStatus: { type: 'success' | 'error'; message: string } | null;
  clearVerificationStatus: () => void;
}

interface StarParticle {
  id: number;
  size: number;
  left: number;
  top: number;
  opacity: number;
  duration: number;
  driftX: number;
  driftY: number;
}

const SignIn: React.FC<SignInProps> = ({ onLoginSuccess, verificationStatus, clearVerificationStatus }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Interaction states
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  // Stars state
  const [stars, setStars] = useState<StarParticle[]>([]);

  // Generate localized star field for Left Column on mount
  useEffect(() => {
    const starCount = 60;
    const generatedStars = Array.from({ length: starCount }).map((_, i) => {
      const size = Math.random() * 2 + 1;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const opacity = Math.random() * 0.7 + 0.1;
      const duration = Math.random() * 20 + 20; // 20-40 seconds
      const driftX = (Math.random() - 0.5) * 100;
      const driftY = (Math.random() - 0.5) * 100;

      return {
        id: i,
        size,
        left,
        top,
        opacity,
        duration,
        driftX,
        driftY
      };
    });
    setStars(generatedStars);
  }, []);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 400);
  };

  // Auto-clear verification banner after 8s
  useEffect(() => {
    if (verificationStatus) {
      const timer = setTimeout(() => {
        clearVerificationStatus();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setShowError(false);
    
    // Redirect browser to Google authentication route on backend
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset banner
    setShowError(false);
    if (verificationStatus) clearVerificationStatus();

    // Validation
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPassword = password.length >= 6; // Match backend validation (min 6 characters)

    if (!isValidEmail) {
      setErrorMessage('Invalid exploration frequency (Email incorrect).');
      setShowError(true);
      triggerShake();
      return;
    }

    if (!isValidPassword) {
      setErrorMessage('Authorization key too short (Min 6 chars).');
      setShowError(true);
      triggerShake();
      return;
    }

    // Start loading state
    setIsLoading(true);

    api.post('/auth/login', { email, password })
      .then((data) => {
        setIsLoading(false);
        setIsSuccess(true);
        onLoginSuccess(data.user, data.accessToken);

        // Auto-redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMessage('Authentication failed. Please check your credentials and try again.');
        setShowError(true);
        triggerShake();
      });
  };

  return (
    <div className="signin-container">
      {/* Left Column: Atmospheric */}
      <section className="signin-left-col">
        {/* Dynamic Star Field inside left column panel */}
        <div className="signin-stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="signin-star-particle"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
                boxShadow: `0 0 ${star.size * 2}px white`,
                '--drift-duration': `${star.duration}s`,
                '--drift-x': `${star.driftX}px`,
                '--drift-y': `${star.driftY}px`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Atmospheric Nebula Background */}
        <div className="signin-nebula-bg">
          <div className="signin-nebula-gradient"></div>
          <div className="signin-nebula-image"></div>
        </div>

        {/* Contents */}
        <div className="signin-left-content">
          {/* Glowing Cyan Orbit Icon */}
          <div className="signin-orbit-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              public
            </span>
          </div>

          <h1 className="signin-left-title">
            Your gateway to the universe
          </h1>

          {/* Feature Pills */}
          <div className="signin-pills-list">
            <div className="signin-glass-pill">
              <span className="material-symbols-outlined">satellite</span>
              <span>🔭 AI Sky Analyzer</span>
            </div>
            <div className="signin-glass-pill">
              <span className="material-symbols-outlined">smart_toy</span>
              <span>🤖 Astronomy Chat</span>
            </div>
            <div className="signin-glass-pill">
              <span className="material-symbols-outlined">rocket_launch</span>
              <span>🚀 NASA Daily Feed</span>
            </div>
          </div>
        </div>

        {/* Vertical Shimmer Divider Line */}
        <div className="signin-shimmer-divider"></div>
      </section>

      {/* Right Column: Form */}
      <section className="signin-right-col">
        <div className={`signin-auth-container ${isShaking ? 'signin-animate-shake' : ''}`}>
          
          {/* Error Banner */}
          {showError && (
            <div className="signin-error-banner">
              <span className="material-symbols-outlined">report</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verification Status Banner */}
          {verificationStatus && (
            <div 
              className="signin-error-banner"
              style={{
                borderColor: verificationStatus.type === 'success' ? '#00e475' : '#ffb4ab',
                background: verificationStatus.type === 'success' ? 'rgba(0, 228, 117, 0.12)' : 'rgba(255, 180, 171, 0.12)'
              }}
            >
              <span 
                className="material-symbols-outlined"
                style={{ color: verificationStatus.type === 'success' ? '#00e475' : '#ffb4ab' }}
              >
                {verificationStatus.type === 'success' ? 'check_circle' : 'report'}
              </span>
              <span 
                style={{ color: '#dde2f1' }}
              >
                {verificationStatus.message}
              </span>
            </div>
          )}

          {/* Success State */}
          {isSuccess ? (
            <div className="signin-success-card">
              <div className="signin-success-icon-wrapper">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h3 className="signin-success-title">Mission Verified</h3>
              <p className="signin-success-msg">Welcome back, Explorer!</p>
              <p className="signin-success-msg-sub">Syncing with Deep Space Network...</p>
            </div>
          ) : (
            <div className={isLoading ? 'signin-form-disabled' : ''}>
              <div className="signin-form-header">
                <span className="signin-form-header-subtitle">Welcome back, Explorer</span>
                <h2 className="signin-form-header-title">Sign In</h2>
              </div>

              {/* Google Auth Button */}
              <button 
                type="button" 
                className="signin-google-btn" 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.22-3.22C17.52 1.64 14.95 1 12 1 7.48 1 3.66 3.62 1.88 7.43l3.86 3C6.63 7.84 9.1 5.04 12 5.04z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.27c0-.8-.07-1.56-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.74-2.4 3.58l3.88 3.01c2.26-2.09 3.54-5.17 3.54-8.83z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.74 15.43c-.24-.7-.37-1.44-.37-2.21s.13-1.51.37-2.21l-3.86-3C1.29 9.3 1 10.61 1 12s.29 2.7.88 3.99l3.86-2.99z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 23c3.1 0 5.71-1.02 7.61-2.77l-3.88-3.01c-1.08.72-2.46 1.15-3.73 1.15-2.9 0-5.37-2.8-6.26-5.39l-3.86 3C3.66 20.38 7.48 23 12 23z"
                    fill="#34A853"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="signin-divider-container">
                <div className="signin-divider-line"></div>
                <span className="signin-divider-text">or sign in with email</span>
                <div className="signin-divider-line"></div>
              </div>

              {/* Email & Password Form */}
              <form className="signin-form" onSubmit={handleSubmit}>
                <div className="signin-input-wrapper">
                  <div className="signin-field-container">
                    <span className="material-symbols-outlined signin-field-icon">mail</span>
                    <input
                      type="email"
                      className="signin-input"
                      placeholder="Explorer Email Address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (verificationStatus) clearVerificationStatus();
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="signin-input-wrapper">
                  <div className="signin-field-container">
                    <span className="material-symbols-outlined signin-field-icon">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="signin-input"
                      placeholder="Command Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (verificationStatus) clearVerificationStatus();
                      }}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="signin-password-toggle"
                      onClick={handleTogglePassword}
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="signin-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="signin-spinner"></div>
                  ) : (
                    <span className="signin-btn-text">
                      Initialize Orbit <span className="material-symbols-outlined">arrow_forward</span>
                    </span>
                  )}
                </button>
              </form>

              <p className="signin-signup-prompt">
                New to the mission?{' '}
                <a 
                  href="#" 
                  className="signin-signup-link" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/signup');
                  }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default SignIn;
