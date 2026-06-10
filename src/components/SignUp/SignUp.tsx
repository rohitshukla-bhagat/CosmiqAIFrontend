import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';
import { api } from '../../lib/api.ts';

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

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        driftY,
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

  const handleGoogleSignUp = () => {
    setIsLoading(true);
    setShowError(false);

    // Redirect to backend Google Auth route
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${API_URL}/auth/google`;
  };

  // Validators helpers
  const isUsernameValid = username.length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordChecks = {
    len: password.length >= 8,
    up: /[A-Z]/.test(password),
    num: /[0-9]/.test(password),
    spec: /[^A-Za-z0-9]/.test(password),
  };

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordStrong = strengthScore === 4;
  const isConfirmMatch = confirmPassword.length > 0 && confirmPassword === password;

  const isFormValid =
    isUsernameValid &&
    isEmailValid &&
    isPasswordStrong &&
    isConfirmMatch &&
    !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset banner
    setShowError(false);

    if (!isUsernameValid) {
      setErrorMessage('Username must be at least 3 characters.');
      setShowError(true);
      triggerShake();
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Invalid email format (Email frequency error).');
      setShowError(true);
      triggerShake();
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password does not meet all mission security parameters.');
      setShowError(true);
      triggerShake();
      return;
    }

    if (!isConfirmMatch) {
      setErrorMessage('Confirmation key does not match password.');
      setShowError(true);
      triggerShake();
      return;
    }

    // Start loading state
    setIsLoading(true);

    api.post('/auth/register', { name: username, email, password })
      .then(() => {
        setIsLoading(false);
        setIsSuccess(true);

        // Auto-redirect to signin page after 6 seconds so user can sign in after email verification
        setTimeout(() => {
          navigate('/signin');
        }, 6000);
      })
      .catch((err: any) => {
        setIsLoading(false);
        setErrorMessage('Registration failed. Please ensure your details are correct and try again.');
        setShowError(true);
        triggerShake();
      });
  };

  // Strength Bar styling helpers
  const bars = [1, 2, 3, 4];
  const strengthColors = ['#ffb4ab', '#ffdad6', '#00daf3', '#00e475'];
  const strengthLabels = ['Weak', 'Fair', 'Strong', 'Very Strong'];

  const getStrengthColor = () => {
    if (strengthScore === 0) return '#849396';
    return strengthColors[strengthScore - 1];
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return 'Enter password';
    return strengthLabels[strengthScore - 1];
  };

  return (
    <div className="signup-container">
      {/* Left Column: Cinematic deep space nebula */}
      <section className="signup-left-col">
        {/* Dynamic Star Field inside left column panel */}
        <div className="signup-stars-container">
          {stars.map((star) => (
            <div
              key={star.id}
              className="signup-star-particle"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
                boxShadow: `0 0 ${star.size * 2}px white`,
                '--drift-duration': `${star.duration}s`,
                '--drift-x': `${star.driftX}px`,
                '--drift-y': `${star.driftY}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Atmospheric Nebula Background */}
        <div className="signup-nebula-bg">
          <div className="signup-nebula-gradient"></div>
          <div className="signup-nebula-image"></div>
        </div>

        {/* Contents */}
        <div className="signup-left-content">
          {/* Glowing Cyan Orbit Icon */}
          <div className="signup-orbit-icon">
            <span className="material-symbols-outlined">track_changes</span>
          </div>

          <div>
            <h1 className="signup-left-title">COSMIQAI</h1>
            <p className="signup-left-subtitle">Begin your cosmic journey</p>
          </div>

          {/* Benefit checklist card */}
          <div className="signup-benefit-card">
            <div className="signup-benefit-item">
              <span className="material-symbols-outlined">check_circle</span>
              <span>AI sky analysis engine</span>
            </div>
            <div className="signup-benefit-item">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Live interstellar chat interface</span>
            </div>
            <div className="signup-benefit-item">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Real-time NASA discovery alerts</span>
            </div>
            <div className="signup-benefit-item">
              <span className="material-symbols-outlined">check_circle</span>
              <span>High-fidelity night sky data</span>
            </div>
          </div>
        </div>

        {/* Vertical Shimmer Divider Line */}
        <div className="signup-shimmer-divider"></div>
      </section>

      {/* Right Column: Form */}
      <section className="signup-right-col">
        <div className={`signup-auth-container ${isShaking ? 'signup-animate-shake' : ''} ${isLoading ? 'is-loading' : ''}`}>
          
          {/* Error Banner */}
          {showError && (
            <div className="signup-error-banner">
              <span className="material-symbols-outlined">report</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success State */}
          {isSuccess ? (
            <div className="signup-success-card">
              <div className="signup-success-icon-wrapper rocket-animate">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <h3 className="signup-success-title">Verification Sent</h3>
              <p className="signup-success-msg">A verification email has been dispatched to {email}.</p>
              <p className="signup-success-msg-sub">Please verify your email address to initialize your mission orbit. Redirecting to login...</p>
            </div>
          ) : (
            <div className={isLoading ? 'signup-form-disabled' : ''}>
              <div className="signup-form-header">
                <span className="signup-form-header-subtitle">Join the mission, Explorer</span>
                <h2 className="signup-form-header-title">Create Account</h2>
                <p className="signup-form-header-prompt">
                  Already a member?{' '}
                  <a
                    href="#"
                    className="signup-form-header-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/signin');
                    }}
                  >
                    Sign In
                  </a>
                </p>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                className="signup-google-btn"
                onClick={handleGoogleSignUp}
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
              <div className="signup-divider-container">
                <div className="signup-divider-line"></div>
                <span className="signup-divider-text">or create with email</span>
                <div className="signup-divider-line"></div>
              </div>

              {/* Form Input fields */}
              <form className="signup-form" onSubmit={handleSubmit}>
                {/* Username Field */}
                <div className="signup-input-group">
                  <label className="signup-input-label">Username</label>
                  <div className="signup-field-container">
                    <span className="material-symbols-outlined signup-field-icon">person</span>
                    <input
                      type="text"
                      className="signup-input"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {username && (
                      <span className={`material-symbols-outlined signup-validation-feedback ${isUsernameValid ? 'valid' : 'invalid'}`}>
                        {isUsernameValid ? 'check_circle' : 'cancel'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="signup-input-group">
                  <label className="signup-input-label">Email Address</label>
                  <div className="signup-field-container">
                    <span className="material-symbols-outlined signup-field-icon">mail</span>
                    <input
                      type="email"
                      className="signup-input"
                      placeholder="explorer@galaxy.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {email && (
                      <span className={`material-symbols-outlined signup-validation-feedback ${isEmailValid ? 'valid' : 'invalid'}`}>
                        {isEmailValid ? 'check_circle' : 'cancel'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Password Strength Area */}
                <div className="signup-input-group">
                  <label className="signup-input-label">Password</label>
                  <div className="signup-field-container">
                    <span className="material-symbols-outlined signup-field-icon">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="signup-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="signup-password-toggle"
                      onClick={handleTogglePassword}
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Visual Strength Meter */}
                  <div className="signup-strength-container">
                    <div className="signup-strength-bars">
                      {bars.map((bar, i) => (
                        <div
                          key={bar}
                          className="signup-strength-bar"
                          style={{
                            backgroundColor: i < strengthScore ? getStrengthColor() : 'rgba(59, 73, 76, 0.2)',
                          }}
                        ></div>
                      ))}
                    </div>
                    <p
                      className="signup-strength-text"
                      style={{ color: getStrengthColor() }}
                    >
                      {getStrengthLabel()}
                    </p>
                  </div>

                  {/* Requirements Badges Grid */}
                  <div className="signup-requirements-grid">
                    <div className={`signup-requirement-item ${passwordChecks.len ? 'signup-requirement-met' : 'signup-requirement-unmet'}`}>
                      <span className="material-symbols-outlined">
                        {passwordChecks.len ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>8+ Characters</span>
                    </div>
                    <div className={`signup-requirement-item ${passwordChecks.up ? 'signup-requirement-met' : 'signup-requirement-unmet'}`}>
                      <span className="material-symbols-outlined">
                        {passwordChecks.up ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Uppercase Letter</span>
                    </div>
                    <div className={`signup-requirement-item ${passwordChecks.num ? 'signup-requirement-met' : 'signup-requirement-unmet'}`}>
                      <span className="material-symbols-outlined">
                        {passwordChecks.num ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>1 Number</span>
                    </div>
                    <div className={`signup-requirement-item ${passwordChecks.spec ? 'signup-requirement-met' : 'signup-requirement-unmet'}`}>
                      <span className="material-symbols-outlined">
                        {passwordChecks.spec ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Special Symbol</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="signup-input-group">
                  <label className="signup-input-label">Confirm Password</label>
                  <div className="signup-field-container">
                    <span className="material-symbols-outlined signup-field-icon">verified_user</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="signup-input"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    {confirmPassword && (
                      <span className={`material-symbols-outlined signup-validation-feedback ${isConfirmMatch ? 'valid' : 'invalid'}`}>
                        {isConfirmMatch ? 'check_circle' : 'cancel'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="signup-submit-btn"
                  disabled={!isFormValid}
                >
                  {isLoading ? (
                    <div className="signup-spinner"></div>
                  ) : (
                    <span className="signup-btn-text">
                      <span className="material-symbols-outlined">rocket_launch</span>
                      INITIATE MISSION
                    </span>
                  )}
                </button>
              </form>

              <div className="signup-signin-prompt">
                <a
                  href="#"
                  className="signup-signin-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/signin');
                  }}
                >
                  ALREADY A MEMBER? SIGN IN
                  <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default SignUp;
