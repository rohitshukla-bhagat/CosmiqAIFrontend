import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import './SkyAnalyzer.css';

const DEFAULT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuD6ATDuS9m6d4tZYLDGxVgIP51_8dl3t_HSlLptvDvT5R3oIXVLd2XXZxkmddaKw7_MRQ5jLQKxvuqB7wDdHee9fSjT8VnbuBXhj5zUOcXsyHHd3_DhNtLeZmOtqVHrtyCU4IrbhHf8UcS4CRf4eTNoFIqU-i4sGUVp1m-P_a4TcdBFLXfixRihttk6aFJDLE4gS9aJT3TR8vZftRwRpNXtXcvhBQ4ndvSKc1GOrl2Ltj099FG_0jJKHdynUXmuLk3epi7l3trwQfQ";

type Phase = 'upload' | 'preview' | 'scanning' | 'result';

interface AnalysisResult {
  title: string;
  subtitle: string;
  matchPercentage: string;
  infoGrid: Array<{ icon: string; label: string; value: string }>;
  description: string;
  insights: string[];
}

interface SkyAnalyzerProps {
  user?: any;
}

const SkyAnalyzer: React.FC<SkyAnalyzerProps> = ({ user }) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>(() => {
    return (sessionStorage.getItem('sa_phase') as Phase) || 'upload';
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    const cachedUrl = sessionStorage.getItem('sa_previewUrl');
    const cachedBase64 = sessionStorage.getItem('sa_base64Data');
    const cachedMime = sessionStorage.getItem('sa_mimeType');
    
    // If we have a cached base64 string, use it to create a reliable data URL
    if (cachedBase64 && cachedMime) {
      return `data:${cachedMime};base64,${cachedBase64}`;
    }
    // Fallback to the saved URL (safe if it's DEFAULT_IMAGE, broken if it's blob)
    return cachedUrl || null;
  });
  const [progress, setProgress] = useState<number>(() => {
    const p = sessionStorage.getItem('sa_phase');
    return p === 'result' ? 100 : 0;
  });
  const [typedText, setTypedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(() => {
    const cached = sessionStorage.getItem('sa_analysisResult');
    return cached ? JSON.parse(cached) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session storage persistence effects
  useEffect(() => {
    sessionStorage.setItem('sa_phase', phase);
  }, [phase]);

  useEffect(() => {
    if (previewUrl) {
      sessionStorage.setItem('sa_previewUrl', previewUrl);
    } else {
      sessionStorage.removeItem('sa_previewUrl');
    }
  }, [previewUrl]);

  useEffect(() => {
    if (analysisResult) {
      sessionStorage.setItem('sa_analysisResult', JSON.stringify(analysisResult));
    } else {
      sessionStorage.removeItem('sa_analysisResult');
    }
  }, [analysisResult]);

  // File selection handlers
  const handleFile = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhase('preview');
      setError(null);

      // Cache base64 for persistence across SPA navigation
      try {
        const base64 = await getBase64(file);
        sessionStorage.setItem('sa_base64Data', base64.data);
        sessionStorage.setItem('sa_mimeType', base64.mimeType);
      } catch (e) {
        console.error("Failed to convert file to base64 for caching", e);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const triggerFileInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const resetUpload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (previewUrl && previewUrl !== DEFAULT_IMAGE && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setError(null);
    setPhase('upload');

    sessionStorage.removeItem('sa_base64Data');
    sessionStorage.removeItem('sa_mimeType');
  };

  const resetAll = () => {
    resetUpload();
    setProgress(0);
    setTypedText('');
  };

  const simulateDefaultUpload = () => {
    setPreviewUrl(DEFAULT_IMAGE);
    setSelectedFile(null); // Indicates using demo image
    setError(null);
    setPhase('preview');
    sessionStorage.removeItem('sa_base64Data');
    sessionStorage.removeItem('sa_mimeType');
  };

  const getBase64 = async (file: File | string): Promise<{ data: string, mimeType: string }> => {
    if (typeof file === 'string') {
      const response = await fetch(file);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          resolve({ data: base64Data, mimeType: blob.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          resolve({ data: base64Data, mimeType: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  // Analyze triggers
  const startAnalysis = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    setPhase('scanning');
    setProgress(0);
    setError(null);

    try {
      let b64Data: string;
      let mime: string;

      if (selectedFile) {
        const b64 = await getBase64(selectedFile);
        b64Data = b64.data;
        mime = b64.mimeType;
      } else if (sessionStorage.getItem('sa_base64Data')) {
        b64Data = sessionStorage.getItem('sa_base64Data')!;
        mime = sessionStorage.getItem('sa_mimeType') || 'image/jpeg';
      } else {
        const b64 = await getBase64(DEFAULT_IMAGE);
        b64Data = b64.data;
        mime = b64.mimeType;
      }
      
      const result: AnalysisResult = await api.post('/analysis/sky', {
        base64Image: b64Data,
        mimeType: mime
      });

      setAnalysisResult(result);
      setProgress(100);
      setPhase('result');
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 429) {
    setError(
      "AI request limit reached. Please wait a moment and try again."
    );
  } else if (err?.response?.status === 503) {
    setError(
      "Our AI astronomer is currently observing too many galaxies at once. Please try again in a few moments."
    );
  } else {
    setError(
      "Our AI encountered a cosmic anomaly during analysis. Please try again or use a different image."
    );
  }
      setPhase('preview');
    }
  };

  // Simulated scanning progress
  useEffect(() => {
    if (phase !== 'scanning') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 8;
        if (next >= 90) {
          // Wait for actual API to finish, cap visual progress at 90%
          return 90;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase]);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'result' || !analysisResult) {
      setTypedText('');
      return;
    }
    let i = 0;
    const description = analysisResult.description;
    
    const interval = setInterval(() => {
      setTypedText(description.substring(0, i + 1));
      i++;
      if (i >= description.length) {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [phase, analysisResult]);

  return (
    <div className="sky-analyzer-container starfield">
      {/* Compact Hero Section */}
      <section className="page-hero analyzer-hero">
        <div className="page-hero-bg analyzer-hero-bg"></div>
        <div className="page-hero-content">
          <h1 className="page-hero-title">Cosmiq Sky Analyzer</h1>
          <p className="page-hero-subtitle">
            Decrypt the cosmic canvas. Upload your celestial captures for deep AI pattern recognition.
          </p>
        </div>
      </section>

      {/* Main Analysis Area */}
      <section className="analyzer-section">
        <div className="analyzer-grid">
          {/* Left Column: Upload Zone */}
          <div className="upload-column" id="upload-zone">
            <div 
              className={`drop-zone ${isDragging ? 'dragging' : ''} ${phase !== 'upload' ? 'previewing' : ''}`}
              onClick={phase === 'upload' ? triggerFileInput : undefined}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (phase === 'upload') {
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              
              {/* State 1: Upload */}
              {phase === 'upload' && (
                <div className="upload-state">
                  <div className="upload-icon-wrapper breathing">
                    <span className="material-symbols-outlined upload-icon" style={{ fontVariationSettings: '"FILL" 0' }}>
                      satellite
                    </span>
                  </div>
                  <h3 className="upload-title">Drop your sky image here</h3>
                  <p className="upload-subtitle">Supports RAW, JPEG, PNG from any observatory or DSLR</p>
                  <div className="upload-actions">
                    <button className="browse-btn" onClick={triggerFileInput}>
                      Browse Files
                    </button>
                    <button className="demo-btn" onClick={(e) => { e.stopPropagation(); simulateDefaultUpload(); }}>
                      Use Demo Image
                    </button>
                  </div>
                </div>
              )}

              {/* State 2: Preview / Loading / Results */}
              {phase !== 'upload' && (
                <div className="preview-state">
                  <div className="preview-image-container">
                    <img 
                      className="preview-image" 
                      src={previewUrl || DEFAULT_IMAGE} 
                      alt="Celestial preview" 
                    />
                    <div className="preview-overlay"></div>
                    {phase === 'preview' && (
                      <button className="close-btn" onClick={resetUpload}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    )}
                  </div>
                  {phase === 'preview' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '1rem'}}>
                      <button className="analyze-btn" onClick={startAnalysis}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                          neurology
                        </span>
                        ANALYZE THIS IMAGE
                      </button>
                      {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', maxWidth: '80%', textAlign: 'center' }}>{error}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Analysis Result Panel */}
          <div className="result-column">
            <div className="result-container">
              {/* State 1: Idle */}
              {phase === 'upload' && (
                <div className="result-idle">
                  <div className="result-idle-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>auto_awesome</span>
                  </div>
                  <p className="result-idle-text">Awaiting celestial data input...</p>
                  <p className="result-idle-subtext">Your analysis will appear here after scanning.</p>
                </div>
              )}

              {/* State 2: Scanning */}
              {phase === 'scanning' && (
                <div className="result-scanning">
                  <div className="scanning-media-wrapper">
                    <img 
                      className="scanning-image" 
                      src={previewUrl || DEFAULT_IMAGE} 
                      alt="Scanning background" 
                    />
                    <div className="scanning-line"></div>
                  </div>
                  <div className="scanning-progress-container">
                    <div className="scanning-progress-header">
                      <span className="scanning-progress-title">Scanning celestial patterns...</span>
                      <span className="scanning-progress-percent">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* State 3: Result Complete */}
              {phase === 'result' && analysisResult && (
                <div className="result-complete">
                  <div className="result-banner">
                    <div className="result-banner-overlay"></div>
                    <div className="result-banner-content">
                      <h2 className="result-banner-title">{analysisResult.title}</h2>
                      <p className="result-banner-subtitle">{analysisResult.subtitle}</p>
                    </div>
                    <div className="result-match-badge-container">
                      <span className="result-match-badge">{analysisResult.matchPercentage} Match</span>
                    </div>
                  </div>

                  {/* 2x2 Info Grid */}
                  <div className="info-grid">
                    {analysisResult.infoGrid.map((info, idx) => (
                      <div className="info-card" key={idx}>
                        <div className="info-card-header">
                          <span className="material-symbols-outlined info-card-icon">{info.icon}</span>
                          <span className="info-card-label">{info.label}</span>
                        </div>
                        <p className="info-card-value">{info.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="insight-container">
                    <h4 className="insight-header">AI Insight Terminal</h4>
                    <p className="insight-text-wrapper">{typedText}</p>
                    
                    <div className="insight-list">
                      {analysisResult.insights.map((insight, idx) => (
                        <div className="insight-item" key={idx}>
                          <span className="material-symbols-outlined insight-item-icon">star</span>
                          <p className="insight-item-text">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="actions-container">
                    <button className="btn-action-primary" onClick={resetAll}>Analyze Another Image</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Tips Section */}
      <section className="tips-section">
        <h3 className="tips-title">What Can You Analyze?</h3>
        <div className="tips-grid">
          <div className="tip-card" onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined tip-card-icon">brightness_3</span>
            <p className="tip-card-label">The Moon</p>
          </div>
          <div className="tip-card" onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined tip-card-icon">wb_sunny</span>
            <p className="tip-card-label">Solar</p>
          </div>
          <div className="tip-card" onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined tip-card-icon">blur_on</span>
            <p className="tip-card-label">Saturn</p>
          </div>
          <div className="tip-card" onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined tip-card-icon">auto_awesome_motion</span>
            <p className="tip-card-label">Milky Way</p>
          </div>
          <div className="tip-card" onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined tip-card-icon">flare</span>
            <p className="tip-card-label">Nebulae</p>
          </div>
          <div className="tip-card" onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined tip-card-icon">hub</span>
            <p className="tip-card-label">Star Clusters</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SkyAnalyzer;
