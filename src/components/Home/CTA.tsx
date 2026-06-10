import { useNavigate } from 'react-router-dom';
import './CTA.css';

interface CTAProps {
  user: any;
}

const CTA: React.FC<CTAProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleLaunchBtn = () => {
    if (user) {
      navigate('/analyzer');
    } else {
      navigate('/signin');
    }
  };

  return (
    <section className="cta-section container">
      <div className="cta-box">
        <div className="cta-bg">
          <div className="cta-bg-1"></div>
          <div className="cta-bg-2"></div>
        </div>
        <div className="cta-content">
          <h2 className="font-display-lg text-headline-lg">Ready for Departure?</h2>
          <p className="font-body-lg text-on-surface-variant cta-desc">
            Join thousands of astronomers and space enthusiasts in the most advanced AI-powered observation community.
          </p>
          <div className="cta-btn-wrapper">
            <button className="btn-primary group" onClick={handleLaunchBtn}>
              Launch CosmiqAI
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">rocket_launch</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
