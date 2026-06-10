import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.ts';
import './NasaFeed.css';

interface ApodItem {
  date: string;
  title: string;
  url: string;
  credit: string;
  explanation: string;
  nasaDescription: string;
  tags: string[];
}

interface NasaFeedProps {
  user: any;
}

const NasaFeed: React.FC<NasaFeedProps> = ({ user }) => {
  const navigate = useNavigate();
  const [apodCatalog, setApodCatalog] = useState<ApodItem[]>(() => {
    const cached = sessionStorage.getItem('cosmiqai_nasa_feed');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const cachedSelected = sessionStorage.getItem('cosmiqai_nasa_feed_selected');
    if (cachedSelected) return cachedSelected;
    
    const cachedFeed = sessionStorage.getItem('cosmiqai_nasa_feed');
    if (cachedFeed) {
      try {
        const parsed = JSON.parse(cachedFeed);
        if (parsed && parsed.length > 0) return parsed[0].date;
      } catch (e) {}
    }
    return '';
  });
  const [bookmarks, setBookmarks] = useState<ApodItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = sessionStorage.getItem('cosmiqai_nasa_feed');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return false;
      } catch (e) {}
    }
    return true;
  });
  const [error, setError] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Fetch bookmarks from backend on mount
  useEffect(() => {
    if (!user) return;
    api.get('/user/bookmarks')
      .then((res: any) => {
        setBookmarks(res.bookmarks || []);
      })
      .catch((err: any) => console.error('Failed to fetch bookmarks:', err));
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return; // Don't fetch if redirecting
    if (apodCatalog.length > 0) return; // Skip fetch if we already have data from sessionStorage

    const fetchNasaFeed = async () => {
      console.log('Fetching NASA feed...');
      try {
        setLoading(true);
        const data: ApodItem[] = await api.get('/nasa-feed');
        setApodCatalog(data);
        if (data.length > 0) {
          setSelectedDate(data[0].date);
        }
      } catch (err: any) {
        setError('Unable to retrieve the NASA feed at this time. Please check your connection or try again later.');
      } finally {
        setLoading(false);
        console.log('NASA feed fetched successfully.');
      }
    };
    fetchNasaFeed();
  }, [user]); // We intentionally do not include apodCatalog.length in the dependency array to only run on initial user load

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    if (apodCatalog.length > 0) {
      sessionStorage.setItem('cosmiqai_nasa_feed', JSON.stringify(apodCatalog));
    }
  }, [apodCatalog]);

  useEffect(() => {
    if (selectedDate) {
      sessionStorage.setItem('cosmiqai_nasa_feed_selected', selectedDate);
    }
  }, [selectedDate]);

  // Derived state: active featured item
  const activeItem = apodCatalog.find(item => item.date === selectedDate) || apodCatalog[0];

  // Lazy load AI explanation when activeItem changes and its explanation is empty
  useEffect(() => {
    if (!activeItem || activeItem.explanation) return; // Already has explanation

    const fetchExplanation = async () => {
      try {
        setAiLoading(true);
        const response = await api.post('/nasa-feed/explain', {
          date: activeItem.date,
          title: activeItem.title,
          nasaDescription: activeItem.nasaDescription
        });

        // Update the catalog with the new explanation
        setApodCatalog(prevCatalog => 
          prevCatalog.map(item => 
            item.date === activeItem.date 
              ? { ...item, explanation: response.explanation, tags: response.tags } 
              : item
          )
        );
      } catch (err) {
        console.error("Failed to generate AI explanation:", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchExplanation();
  }, [activeItem]);

  // Keyboard escape listener to dismiss lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrevDate = () => {
    const index = apodCatalog.findIndex(item => item.date === selectedDate);
    if (index !== -1 && index < apodCatalog.length - 1) {
      setSelectedDate(apodCatalog[index + 1].date);
    } else if (apodCatalog.length > 0) {
      setSelectedDate(apodCatalog[0].date); // Wrap around to newest
    }
  };

  const handleNextDate = () => {
    const index = apodCatalog.findIndex(item => item.date === selectedDate);
    if (index > 0) {
      setSelectedDate(apodCatalog[index - 1].date);
    } else if (apodCatalog.length > 0) {
      setSelectedDate(apodCatalog[apodCatalog.length - 1].date); // Wrap around to oldest
    }
  };

  const isBookmarked = (date: string) => bookmarks.some(b => b.date === date);

  const toggleBookmark = async (item: ApodItem) => {
    if (isBookmarked(item.date)) {
      // Remove
      try {
        const res: any = await api.delete(`/user/bookmarks/${item.date}`);
        setBookmarks(res.bookmarks || []);
      } catch (err) {
        console.error('Failed to remove bookmark:', err);
      }
    } else {
      // Add
      try {
        const res: any = await api.post('/user/bookmarks', {
          date: item.date,
          title: item.title,
          url: item.url,
          credit: item.credit,
          explanation: item.explanation,
          nasaDescription: item.nasaDescription,
          tags: item.tags,
        });
        setBookmarks(res.bookmarks || []);
      } catch (err) {
        console.error('Failed to add bookmark:', err);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const startExploring = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert dates format for past gallery (e.g. '2023-10-23' -> 'Oct 23, 2023')
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Short labels for cards (e.g. 'Oct 23, 2023' -> 'Oct 23')
  const formatCardLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) return null; // Wait for redirect to happen

  if (loading) {
    return (
      <div className="nasa-feed-container flex flex-col items-center justify-center relative">
        <div className="feed-stars-bg absolute"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute"></div>
            <div className="absolute" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute" style={{ animationDuration: '2s' }}></div>
            <span className="absolute flex items-center justify-center material-symbols-outlined">satellite_alt</span>
          </div>
          <h2 className="font-display-md tracking-widest uppercase text-center">Establishing Deep Space Connection</h2>
          <p className="tracking-widest text-center">Receiving transmission from NASA Mainframe...</p>
        </div>
      </div>
    );
  }

  if (error || !activeItem) {
    return (
      <div className="nasa-feed-container flex flex-col items-center justify-center relative">
        <div className="feed-stars-bg absolute"></div>
        <div className="relative z-10 flex flex-col items-center text-center glass-panel">
          <span className="material-symbols-outlined">wifi_off</span>
          <h2 className="font-display-md uppercase tracking-widest">Transmission Failed</h2>
          <p className="font-body-md">
            We encountered an anomaly while connecting to the NASA Astrophysics Data System. 
            The signal was lost in transit.
          </p>
          <div className="w-full">
            <span className="uppercase tracking-widest">Diagnostic Log:</span>
            <span className="">{error || 'No telemetry data available'}</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="font-label-md transition-colors uppercase tracking-widest flex items-center"
          >
            <span className="material-symbols-outlined">refresh</span>
            Re-establish Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nasa-feed-container">
      {/* 1. Compact Hero Band */}
      <section className="page-hero feed-hero">
        <div className="feed-stars-bg pointer-events-none"></div>
        <div className="feed-hero-gradient pointer-events-none"></div>
        <div className="page-hero-content">
          <div className="feed-badge glow-orange animate-float">
            <span className="material-symbols-outlined rocket-icon">rocket_launch</span>
            <span className="feed-badge-text">NASA APOD • UPDATED DAILY</span>
          </div>
          <h1 className="page-hero-title">
            Cosmiq NASA Feed
          </h1>
          <p className="page-hero-subtitle">
            Discover the cosmos through NASA's daily Astronomy Picture of the Day, curated by AI intelligence.
          </p>
        </div>
      </section>

      {/* 2. Today's Featured APOD (Hero Card) */}
      <section className="featured-section scroll-reveal">
        <div className="featured-image-wrapper">
          <img 
            alt={activeItem.title}
            className="featured-image"
            src={activeItem.url}
          />
          <div className="featured-overlay"></div>
          
          {/* Content Overlay */}
          <div className="featured-content">
            <div className="featured-details">
              <div className="details-header-row">
                <span className="featured-tag">NASA APOD</span>
                <div className="separator-dot"></div>
                <span className="featured-date">{formatDateLabel(activeItem.date)}</span>
              </div>
              <h2 className="featured-title text-headline-lg">
                {activeItem.title}
              </h2>
              <p className="featured-credit">
                Image Credit &amp; Copyright: {activeItem.credit}
              </p>
            </div>
            
            <div className="featured-actions">
              <button
                onClick={() => toggleBookmark(activeItem)}
                className={`action-circle-btn ${isBookmarked(activeItem.date) ? 'bookmarked shadow-gold' : ''}`}
                title="Bookmark"
              >
                <span className="material-symbols-outlined">
                  {isBookmarked(activeItem.date) ? 'bookmark_added' : 'bookmark'}
                </span>
              </button>
              <button
                onClick={() => handleDownload(activeItem.url)}
                className="action-circle-btn shadow-cyan"
                title="Download"
              >
                <span className="material-symbols-outlined">download</span>
              </button>
              <button
                onClick={handleShare}
                className="action-circle-btn shadow-cyan"
                title="Share"
              >
                <span className="material-symbols-outlined">share</span>
              </button>
              <button
                onClick={() => setLightboxOpen(true)}
                className="action-circle-btn shadow-cyan"
                title="Fullscreen"
              >
                <span className="material-symbols-outlined">fullscreen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Temporary Copy Alert Toast */}
        {copied && (
          <div className="toast-notification">
            <span className="material-symbols-outlined toast-icon">link</span>
            <span>Project link copied to clipboard!</span>
          </div>
        )}
      </section>

      {/* 3. AI Explanation + NASA Description */}
      <section className="description-section container scroll-reveal">
        <div className="description-grid">
          {/* Left Column: AI Explanation */}
          <div className="ai-explanation-col">
            <div className="ai-badge">
              <span className="material-symbols-outlined ai-icon" style={{ animationDuration: '4s' }}>
                auto_awesome
              </span>
              <span className="ai-badge-text uppercase">✦ CosmiqAI Explains</span>
            </div>
            <h3 className="explanation-title font-headline-md">What Are You Looking At?</h3>
            
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center bg-black/40">
                <span className="material-symbols-outlined" style={{ animationDuration: '4s' }}>
                  settings_system_daydream
                </span>
                <p className="uppercase tracking-widest">
                  CosmiqAI is analyzing telemetry...
                </p>
              </div>
            ) : (
              <>
                <p className="explanation-text text-body-lg">
                  {activeItem.explanation || "No explanation available."}
                </p>
                <div className="tags-flex">
                  {activeItem.tags && activeItem.tags.map((tag, idx) => (
                    <div key={idx} className="tag-pill glass-panel">
                      <span className="material-symbols-outlined tag-icon">
                        {idx === 0 ? 'info' : idx === 1 ? 'stars' : 'visibility'}
                      </span>
                      <span className="tag-label">{tag}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Column: NASA Description */}
          <div className="nasa-description-col">
            <div className="nasa-desc-card glass-panel">
              <div className="card-header-row">
                <h4 className="nasa-desc-title font-headline-md text-headline-sm">Official NASA Description</h4>
                <span className="material-symbols-outlined nasa-desc-icon">article</span>
              </div>
              <div className="nasa-desc-scroll">
                <p className="nasa-desc-text font-body-md">
                  {activeItem.nasaDescription}
                </p>
              </div>
              <div className="nasa-desc-footer">
                <p className="disclaimer-text">
                  Source: NASA Astrophysics Data System. Disclaimer: NASA does not endorse CosmiqAI services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Date Picker & Recent Gallery */}
      <section className="gallery-section scroll-reveal">
        <div className="gallery-inner container">
          <div className="gallery-header-row">
            <h3 className="gallery-title font-headline-md">Explore Past Images</h3>
            <div className="date-controls glass-panel">
              <button
                onClick={handlePrevDate}
                className="date-nav-btn"
                title="Older Image"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <input
                className="date-input font-body-md"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (apodCatalog.some(item => item.date === val)) {
                    setSelectedDate(val);
                  }
                }}
                min={apodCatalog.length > 0 ? apodCatalog[apodCatalog.length - 1].date : ''}
                max={apodCatalog.length > 0 ? apodCatalog[0].date : ''}
              />
              <button
                onClick={handleNextDate}
                className="date-nav-btn"
                title="Newer Image"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Gallery Items Grid/Carousel */}
          <div className="gallery-items-scroll">
            {apodCatalog.map((item) => (
              <div
                key={item.date}
                onClick={() => setSelectedDate(item.date)}
                className={`gallery-item-card ${item.date === selectedDate ? 'active-gallery-card' : ''}`}
              >
                <div className="gallery-image-box">
                  <img 
                    alt={item.title}
                    className="gallery-item-image"
                    src={item.url}
                  />
                  <div className="gallery-image-overlay"></div>
                </div>
                <p className="gallery-item-date">{formatCardLabel(item.date)}</p>
                <p className="gallery-item-title font-label-md truncate">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Saved Images (Your Celestial Collection) */}
      <section className="collection-section container scroll-reveal">
        <div className="collection-header flex items-center">
          <span className="material-symbols-outlined collection-header-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
            stars
          </span>
          <h3 className="collection-title font-headline-md">Your Celestial Collection</h3>
        </div>

        {/* Dynamic bookmarked grid cards */}
        {bookmarks.length === 0 ? (
          <div className="collection-empty-card">
            <span className="material-symbols-outlined empty-icon">auto_awesome_motion</span>
            <p className="empty-title font-body-lg">
              Your bookmarked celestial images will appear here.
            </p>
            <button
              onClick={startExploring}
              className="start-explore-btn font-label-md"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="collection-grid">
            {bookmarks.map(item => (
              <div
                key={item.date}
                className="collection-card glass-panel"
                onClick={() => {
                  // If item is in the current feed, navigate to it
                  if (apodCatalog.some(a => a.date === item.date)) {
                    setSelectedDate(item.date);
                    startExploring();
                  }
                }}
              >
                <div className="collection-img-box">
                  <img src={item.url} alt={item.title} className="collection-img" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item);
                    }}
                    className="collection-delete-btn"
                    title="Remove Bookmark"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="collection-card-details">
                  <span className="collection-card-date">{formatDateLabel(item.date)}</span>
                  <h4 className="collection-card-title truncate">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Fun Stats Strip */}
      <section className="stats-strip scroll-reveal">
        <div className="stats-strip-inner container">
          <div className="stat-strip-box">
            <span className="material-symbols-outlined stat-icon">history</span>
            <p className="stat-number font-headline-md">Since 2026</p>
            <p className="stat-label uppercase">Digital Archive</p>
          </div>
          <div className="stat-strip-box">
            <span className="material-symbols-outlined stat-icon">database</span>
            <p className="stat-number font-headline-md">100+</p>
            <p className="stat-label uppercase">Curated Images</p>
          </div>
          <div className="stat-strip-box">
            <span className="material-symbols-outlined stat-icon">update</span>
            <p className="stat-number font-headline-md">Daily</p>
            <p className="stat-label uppercase">New Content</p>
          </div>
          <div className="stat-strip-box">
            <span className="material-symbols-outlined stat-icon">api</span>
            <p className="stat-number font-headline-md">Free API</p>
            <p className="stat-label uppercase">Public Access</p>
          </div>
        </div>
      </section>

      {/* 7. Lightbox Fullscreen Overlay */}
      {lightboxOpen && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <button
            className="lightbox-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img 
            alt={activeItem.title}
            className="lightbox-image"
            src={activeItem.url}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="lightbox-footer" onClick={(e) => e.stopPropagation()}>
            <h5 className="lightbox-title font-headline-md">{activeItem.title}</h5>
            <p className="lightbox-date font-label-md">{formatDateLabel(activeItem.date)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NasaFeed;
