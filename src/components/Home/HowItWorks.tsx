import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  return (
    <section className="steps-section">
      <div className="container">
        <div className="section-header">
          <h2 className="font-headline-lg text-headline-lg">Mission Protocol</h2>
          <p className="font-body-lg text-on-surface-variant">Simple execution for complex discoveries.</p>
        </div>
        
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number num-primary">1</div>
            <h4 className="font-headline-sm text-headline-sm">Upload</h4>
            <p className="font-body-md text-on-surface-variant">Securely ingest your celestial photography into our localized vault.</p>
          </div>
          
          <div className="step-line-h step-line-h-1 dashed-line"></div>
          
          <div className="step-item">
            <div className="step-number num-secondary">2</div>
            <h4 className="font-headline-sm text-headline-sm">Analyze</h4>
            <p className="font-body-md text-on-surface-variant">Advanced neural networks process light signatures and star patterns.</p>
          </div>
          
          <div className="step-line-h step-line-h-2 dashed-line"></div>
          
          <div className="step-item">
            <div className="step-number num-primary">3</div>
            <h4 className="font-headline-sm text-headline-sm">Discover</h4>
            <p className="font-body-md text-on-surface-variant">Receive comprehensive reports on objects identified in your viewport.</p>
          </div>
          
          {/* Mobile Connecting Line */}
          <div className="step-line-v dashed-line"></div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
