import './Stats.css';

const Stats: React.FC = () => {
  return (
    <section className="stats-section">
      <div className="container stats-grid">
        <div>
          <span className="stat-number">5+</span>
          <span className="stat-label">Core Modules</span>
        </div>
        <div>
          <span className="stat-number">3+</span>
          <span className="stat-label">API Integrations</span>
        </div>
        <div>
          <span className="stat-number">10+</span>
          <span className="stat-label">NASA Official Images</span>
        </div>
        <div>
          <span className="stat-number">200+</span>
          <span className="stat-label">Analyzed Images</span>
        </div>
      </div>
    </section>
  );
};

export default Stats;
