import { useNavigate } from 'react-router-dom';
import './Hero.css';

interface HeroProps {
  user: any;
  isAudioPlaying: boolean;
  toggleAudio: () => void;
}

const Hero: React.FC<HeroProps> = ({ user, isAudioPlaying, toggleAudio }) => {
  const navigate = useNavigate();

  const handleLaunchBtn = () => {
    if (user) {
      navigate('/analyzer');
    } else {
      navigate('/signin');
    }
  }
  return (
    <section className="hero-section container">
      <div className="hero-grid">
        <div className="hero-content">
          <div className="hero-badges">
            <span className="badge badge-primary">Next-Gen Observation</span>
            <span className="badge badge-secondary">v2.0 Beta</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface">
            Explore the <span className="text-gradient-cyan">Universe</span> with AI
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant hero-desc">
            Unveil the mysteries of the cosmos through our AI-powered astronomers. Upload night sky captures
            for instant analysis or chat with our neural network trained on deep-space data.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={handleLaunchBtn}>
              Launch Observatory
            </button>
            <button className={`music-toggle-btn ${isAudioPlaying ? 'playing' : ''}`} onClick={toggleAudio}>
              <div className="music-icon-wrapper">
                {isAudioPlaying ? (
                  <div className="audio-wave">
                    <span></span><span></span><span></span><span></span>
                  </div>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    volume_off
                  </span>
                )}
              </div>
              <span className="music-btn-text">
                {isAudioPlaying ? 'Stop Music' : 'Start Music'}
              </span>
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-block">
              <span className="block font-display-lg text-headline-sm text-primary">200+</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase"> Analyzed</span>
            </div>
            <div className="hero-stat-block">
              <span className="block font-display-lg text-headline-sm text-secondary"> 24/7</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase"> Live Feed</span>
            </div>
            <div className="hero-stat-block">
              <span className="block font-display-lg text-headline-sm text-primary">99.2%</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase"> Accuracy</span>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="earth-container">
            <div className="earth-atmosphere"></div>
            <div className="earth-globe">
              <video 
                src="/heroVideo.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
              />
            </div>
            <div className="live-tracking-badge">
              <div className="live-tracking-badge-inner">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px' }}>
                  rocket_launch
                </span>
                <span className="font-label-sm text-label-sm text-primary">Expand Your Knowledge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
