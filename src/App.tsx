import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import StarField from './components/Home/StarField.tsx';
import Header from './components/common/Header.tsx';
import Hero from './components/Home/Hero.tsx';
import Features from './components/Home/Features.tsx';
import HowItWorks from './components/Home/HowItWorks.tsx';
import Stats from './components/Home/Stats.tsx';
import CTA from './components/Home/CTA.tsx';
import Footer from './components/common/Footer.tsx';
import SkyAnalyzer from './components/SkyAnalyzer/SkyAnalyzer.tsx';
import Chat from './components/Chat/Chat.tsx';
import NightSky from './components/NightSky/NightSky.tsx';
import NasaFeed from './components/NasaFeed/NasaFeed.tsx';
import SignIn from './components/SignIn/SignIn.tsx';
import SignUp from './components/SignUp/SignUp.tsx';
import { api } from './lib/api.ts';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [_accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [verificationStatus, setVerificationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Global Audio State
  const [isAudioPlaying, setIsAudioPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        // Play might fail if user hasn't interacted with the page yet
        audioRef.current.play().catch(e => {
          console.log('Audio autoplay blocked by browser', e);
          setIsAudioPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isAudioPlaying]);

  const toggleAudio = () => setIsAudioPlaying(!isAudioPlaying);


  // Check for email verification status and Google Auth redirects in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const message = params.get('message');
    const token = params.get('token');
    const googleUser = params.get('user');
    
    if (verified || (token && googleUser)) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (token && googleUser) {
        try {
          const userData = JSON.parse(decodeURIComponent(googleUser));
          handleLoginSuccess(userData, token);
          navigate('/');
        } catch (err) {
          console.error("Failed to parse Google user payload:", err);
        }
      } else if (verified === 'true') {
        setVerificationStatus({ type: 'success', message: 'Email verified successfully! You can now sign in.' });
        navigate('/signin');
      } else if (verified === 'already') {
        setVerificationStatus({ type: 'success', message: 'Email is already verified! You can sign in.' });
        navigate('/signin');
      } else if (verified === 'false') {
        setVerificationStatus({ type: 'error', message: message || 'Verification failed. Please try again.' });
        navigate('/signin');
      }
    }
  }, [navigate]);

  // Listen for auto-logout (session expired) from API
  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setUser(null);
      setAccessToken(null);
      navigate('/signin');
    };
    
    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth_session_expired', handleSessionExpired);
  }, [navigate]);

  const handleLoginSuccess = (userData: any, token: string) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
    setUser(userData);
    setAccessToken(token);
  };

  const handleSignOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setUser(null);
      setAccessToken(null);
      navigate('/');
    }
  };

  return (
    <>
      <StarField />
      <Header 
        user={user}
        onSignOut={handleSignOut}
      />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero user={user} isAudioPlaying={isAudioPlaying} toggleAudio={toggleAudio} />
              <Features />
              <HowItWorks />
              <Stats />
              <CTA user={user} />
            </>
          } />
          <Route path="/analyzer" element={<SkyAnalyzer user={user} />} />
          <Route path="/chat" element={<Chat user={user} />} />
          <Route path="/nightsky" element={<NightSky user={user} />} />
          <Route path="/nasafeed" element={<NasaFeed user={user} />} />
          <Route path="/signin" element={
            <SignIn 
              onLoginSuccess={handleLoginSuccess}
              verificationStatus={verificationStatus}
              clearVerificationStatus={() => setVerificationStatus(null)}
            />
          } />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
      <Footer />
      {/* Background Audio */}
      <audio ref={audioRef} src="/bgAudio.mp3" loop />
    </>
  );
}

export default App;

