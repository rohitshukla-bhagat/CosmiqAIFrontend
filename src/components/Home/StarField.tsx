import React, { useEffect, useState } from 'react';
import './StarField.css';

const StarField: React.FC = () => {
  const [stars, setStars] = useState<{ id: number; size: number; left: number; top: number; duration: number }[]>([]);
  const [shootingStars, setShootingStars] = useState<{ id: number; left: number; top: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate static stars
    const starCount = window.innerWidth < 768 ? 100 : 200;
    const initialStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 3 + 2,
    }));
    setStars(initialStars);

    // Shooting stars logic
    let shootingStarIdCounter = 0;
    const interval = setInterval(() => {
      const newShootingStar = {
        id: shootingStarIdCounter++,
        left: Math.random() * 100,
        top: Math.random() * 50,
        delay: Math.random() * 5,
      };

      setShootingStars(prev => [...prev, newShootingStar]);

      // Remove after animation (6s)
      setTimeout(() => {
        setShootingStars(prev => prev.filter(s => s.id !== newShootingStar.id));
      }, 6000);
    }, window.innerWidth < 768 ? 6000 : 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="star-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.left}%`,
            top: `${star.top}%`,
            '--duration': `${star.duration}s`
          } as React.CSSProperties}
        />
      ))}
      {shootingStars.map((s) => (
        <div
          key={s.id}
          className="shooting-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export default StarField;
