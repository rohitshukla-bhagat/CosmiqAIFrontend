import React, { useRef } from 'react';
import './Features.css';

const FeatureCard: React.FC<{
  icon: string;
  bgIcon: string;
  title: string;
  desc: string;
  progressPercent: string;
  theme: 'primary' | 'secondary';
}> = ({ icon, bgIcon, title, desc, progressPercent, theme }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      className="glass-card group"
      onMouseMove={handleMouseMove}
    >
      <div className="feature-bg-icon">
        <span className="material-symbols-outlined">{bgIcon}</span>
      </div>
      <div className={`feature-icon-wrapper ${theme === 'primary' ? 'icon-primary pulse-icon' : 'icon-secondary'}`}>
        <span className={`material-symbols-outlined feature-icon ${theme}`}>{icon}</span>
      </div>
      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-desc">{desc}</p>
      <div className="progress-bar">
        <div
          className={`progress-fill ${theme === 'primary' ? 'fill-primary' : 'fill-secondary'}`}
          style={{ width: progressPercent }}
        ></div>
      </div>
    </div>
  );
};

const Features: React.FC = () => {
  return (
    <section className="features-section container">
      <div className="section-header">
        <h2 className="section-title">Precision Instruments</h2>
        <p className="section-desc">
          Equipped with state-of-the-art computational tools to help you navigate the celestial sphere with surgical precision.
        </p>
      </div>
      
      <div className="features-grid">
        <FeatureCard
          icon="camera"
          bgIcon="radar"
          title="AI Sky Analyzer"
          desc="Upload raw sky images for instant identification of constellations, nebulae, and satellites."
          progressPercent="66.66%"
          theme="primary"
        />
        <FeatureCard
          icon="chat_bubble"
          bgIcon="smart_toy"
          title="AI Astronomy Chat"
          desc="Engage with a digital astronomer trained on over 50 years of NASA research data."
          progressPercent="50%"
          theme="secondary"
        />
        <FeatureCard
          icon="auto_awesome"
          bgIcon="explore"
          title="Night Sky Viewer"
          desc="Real-time 3D star chart mapped to your coordinates. Discover what's visible tonight."
          progressPercent="100%"
          theme="primary"
        />
        <FeatureCard
          icon="satellite_alt"
          bgIcon="rss_feed"
          title="NASA Space Feed"
          desc="Direct API integration with NASA’s Open Data. High-res imagery from Webb and Hubble."
          progressPercent="75%"
          theme="secondary"
        />
      </div>
    </section>
  );
};

export default Features;
