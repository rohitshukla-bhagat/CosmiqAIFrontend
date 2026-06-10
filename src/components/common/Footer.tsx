import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <img src="/CosmiqAI.png" alt="CosmiqAI Logo" style={{ height: '24px', marginRight: '8px' }} />
            <span className="font-display-lg text-label-md text-primary uppercase">CosmiqAI</span>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">© 2026 CosmiqAI. Powered by NASA Open APIs.</p>
        </div>
        
        <div className="footer-links">
          <a className="footer-link" href="https://www.linkedin.com/in/rohitshuklabhagat/" target="_blank">LinkedLn</a>
          <a className="footer-link" href="https://github.com/rohitshukla-bhagat" target="_blank">GitHub</a>
          <a className="footer-link" href="https://www.youtube.com/@techoderr/featured" target="_blank">YouTube</a>
          <a className="footer-link" href="https://www.instagram.com/techoderr/" target="_blank">Instagram</a>
          <a className="footer-link" href="https://www.facebook.com/rohitshukla.bhagat" target="_blank">Facebook</a>
        </div>
        
        
      </div>
    </footer>
  );
};

export default Footer;
