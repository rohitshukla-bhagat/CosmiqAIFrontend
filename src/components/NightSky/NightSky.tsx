import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NightSky.css';
import { api } from '../../lib/api.ts';

interface TwinkleStar {
  id: number;
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
}

interface ISSPass {
  time: string;
  elev: string;
  dir: string;
  duration: string;
}

interface NightSkyProps {
  user?: any;
}

const NightSky: React.FC<NightSkyProps> = ({ user }) => {
  const navigate = useNavigate();
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'calibrating' | 'granted'>(() => {
    return (sessionStorage.getItem('ns_locationStatus') as any) || 'prompt';
  });
  const [locationName, setLocationName] = useState<string>(() => {
    return sessionStorage.getItem('ns_locationName') || 'Lucknow, Uttar Pradesh, India';
  });


  const [stars, setStars] = useState<TwinkleStar[]>(() => {
    const cached = sessionStorage.getItem('ns_stars');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [issPasses, setIssPasses] = useState<ISSPass[]>(() => {
    const cached = sessionStorage.getItem('ns_issPasses');
    return cached ? JSON.parse(cached) : [];
  });
  const [moonData, setMoonData] = useState<any>(() => {
    const cached = sessionStorage.getItem('ns_moonData');
    return cached ? JSON.parse(cached) : null;
  });
  const [planetsData, setPlanetsData] = useState<any[]>(() => {
    const cached = sessionStorage.getItem('ns_planetsData');
    return cached ? JSON.parse(cached) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lat, setLat] = useState<number | null>(() => {
    const cached = sessionStorage.getItem('ns_lat');
    return cached ? parseFloat(cached) : null;
  });
  const [lon, setLon] = useState<number | null>(() => {
    const cached = sessionStorage.getItem('ns_lon');
    return cached ? parseFloat(cached) : null;
  });
  const [dataFetched, setDataFetched] = useState<boolean>(() => {
    return sessionStorage.getItem('ns_dataFetched') === 'true';
  });

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Persist state
  useEffect(() => {
    sessionStorage.setItem('ns_locationStatus', locationStatus);
    sessionStorage.setItem('ns_locationName', locationName);
    if (lat !== null) sessionStorage.setItem('ns_lat', lat.toString());
    if (lon !== null) sessionStorage.setItem('ns_lon', lon.toString());
  }, [locationStatus, locationName, lat, lon]);

  useEffect(() => {
    if (issPasses.length > 0) sessionStorage.setItem('ns_issPasses', JSON.stringify(issPasses));
    if (moonData) sessionStorage.setItem('ns_moonData', JSON.stringify(moonData));
    if (planetsData.length > 0) sessionStorage.setItem('ns_planetsData', JSON.stringify(planetsData));
  }, [issPasses, moonData, planetsData]);

  // Sun Position state
  const [sunX, setSunX] = useState<number>(100);
  const [sunY, setSunY] = useState<number>(90);
  const [sunAltitude, setSunAltitude] = useState<number>(-12.4);
  const [sunAzimuth] = useState<number>(284); // Mock default constant

  // Initialize twinkling stars on mount
  useEffect(() => {
    if (stars.length === 0) {
      const starCount = 60;
      const generatedStars: TwinkleStar[] = [];
      for (let i = 0; i < starCount; i++) {
        generatedStars.push({
          id: i,
          cx: Math.random() * 800,
          cy: Math.random() * 450,
          r: Math.random() * 1.2 + 0.3,
          duration: 2 + Math.random() * 4,
          delay: Math.random() * 5,
        });
      }
      setStars(generatedStars);
      sessionStorage.setItem('ns_stars', JSON.stringify(generatedStars));
    }
  }, [stars.length]);

  // Sun Arc Position Calculation
  useEffect(() => {
    const updateSunPosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = (hours * 60) + minutes;

      let x = 100;
      let y = 90;
      let alt = -12.4;

      if (totalMinutes >= 360 && totalMinutes <= 1080) { // Day: 6am to 6pm
        const progress = (totalMinutes - 360) / 720; // 0 to 1
        x = 10 + (progress * 180);
        // Parabolic arc: y = a(x-h)^2 + k
        // peak at 100,10. (10,90): 90 = a(10-100)^2 + 10 => 80 = a(8100) => a = 0.0098
        y = 0.0098 * Math.pow(x - 100, 2) + 10;
        alt = Math.round((1 - Math.abs(progress - 0.5) * 2) * 90);
      } else { // Night
        const nightProgress = totalMinutes < 360
          ? (totalMinutes + 1440 - 1080) / 720
          : (totalMinutes - 1080) / 720;
        x = 190 - (nightProgress * 180);
        y = 105; // Below horizon line
        alt = Math.round(-nightProgress * 90);
      }

      setSunX(x);
      setSunY(y);
      setSunAltitude(alt);
    };

    updateSunPosition();
    // Update every minute
    const interval = setInterval(updateSunPosition, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (locationStatus === 'granted' && lat !== null && lon !== null) {
      if (dataFetched) return; // Skip if we already cached data this session

      setIsLoading(true);
      api.get(`/night-sky?lat=${lat}&lon=${lon}`)
        .then(res => {
          if (res.issData && res.issData.passes) {
             const passes = res.issData.passes.map((p: any) => {
                const durationMinutes = Math.round((new Date(p.set.time).getTime() - new Date(p.rise.time).getTime()) / 60000);
                return {
                  time: new Date(p.rise.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  elev: `${Math.round(p.culmination.elevation_deg)}°`,
                  dir: `${p.rise.compass} to ${p.set.compass}`,
                  duration: `${durationMinutes} MIN`
                };
             });
             setIssPasses(passes);
          }
          if (res.moonSunData && res.moonSunData.properties && res.moonSunData.properties.data) {
             setMoonData(res.moonSunData.properties.data);
          }
          if (res.planetsData && Array.isArray(res.planetsData)) {
            setPlanetsData(res.planetsData);
          }
          setDataFetched(true);
          sessionStorage.setItem('ns_dataFetched', 'true');
        })
        .catch(err => {
          console.error("Error fetching night sky data:", err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [locationStatus, lat, lon, dataFetched]);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const R = Math.min(cx, cy) - 20;

      // Draw outer rings
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx, cy, R / 2, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw stars with twinkling
      const time = Date.now() / 1000;
      stars.forEach(star => {
         const alpha = 0.5 + 0.5 * Math.sin(time * (2 * Math.PI / star.duration) + star.delay);
         ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
         ctx.beginPath();
         ctx.arc(star.cx, star.cy, star.r, 0, 2 * Math.PI);
         ctx.fill();
      });

      // Draw planets
      planetsData.forEach(planet => {
        if (planet.altitude !== null && planet.altitude !== undefined && planet.altitude > 0) {
          const alt = planet.altitude;
          const az = planet.azimuth * Math.PI / 180;
          
          // altitude 90 = center (r=0), altitude 0 = edge (r=R)
          const r = R * ((90 - alt) / 90);
          
          const x = cx + r * Math.sin(az);
          const y = cy - r * Math.cos(az);
          
          let color = '#fff';
          const name = planet.name ? planet.name.toLowerCase() : '';
          if (name === 'mars') color = '#ff5722';
          else if (name === 'venus') color = '#ffd54f';
          else if (name === 'jupiter') color = '#ffb300';
          else if (name === 'saturn') color = '#ffe082';
          else if (name === 'mercury') color = '#9e9e9e';
          else if (name === 'uranus') color = '#4dd0e1';
          else if (name === 'neptune') color = '#1976d2';

          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          // Reset glow for text
          ctx.shadowBlur = 0;

          // Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '12px "Orbitron", sans-serif';
          ctx.fillText(planet.name, x + 8, y + 4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [planetsData, stars]);

  const handleGetLocation = () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    setLocationStatus('calibrating');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTimeout(() => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            setLat(latitude);
            setLon(longitude);
            setLocationName(`Geolocated Observer (Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)})`);
            setLocationStatus('granted');
          }, 1200);
        },
        (error) => {
          console.warn('Geolocation blocked or failed. Using fallback location.', error);
          setTimeout(() => {
            setLat(26.84);
            setLon(80.94);
            setLocationName('Lucknow, Uttar Pradesh, India');
            setLocationStatus('granted');
          }, 1200);
        }
      );
    } else {
      setTimeout(() => {
        setLat(26.84);
        setLon(80.94);
        setLocationName('Lucknow, Uttar Pradesh, India');
        setLocationStatus('granted');
      }, 1200);
    }
  };

  return (
    <div className="night-sky-container">
      {/* Hero Header */}
      <header className="page-hero ns-hero">
        <div className="ns-hero-starfield"></div>
        <div className="ns-hero-gradient"></div>
        <div className="ns-hero-glow"></div>
        <div className="page-hero-content">
          <h1 className="page-hero-title">
            Cosmiq Night Sky
          </h1>
          <p className="page-hero-subtitle">
            Real-time celestial data precision-engineered for your exact planetary coordinates.
          </p>
        </div>
      </header>

      <div className="ns-content-wrapper container">
        {/* State 1: Location Request */}
        {locationStatus !== 'granted' && (
          <section className="ns-reveal location-request-section">
            <div className="location-card glass-panel">
              <div className={`location-icon-wrapper ${locationStatus === 'calibrating' ? 'calibrating-pulse' : 'glow'}`}>
                <span className="material-symbols-outlined location-icon">
                  {locationStatus === 'calibrating' ? 'sync' : 'location_on'}
                </span>
              </div>
              <div className="location-text">
                <h2 className="location-title">
                  {locationStatus === 'calibrating' ? 'Calibrating Telemetry...' : 'Allow Location Access'}
                </h2>
                <p className="location-description">
                  {locationStatus === 'calibrating' 
                    ? 'Synchronizing sensor arrays with real-time coordinate frames...'
                    : 'To calculate precise visibility for your zenith, we need to access your device\'s telemetry data.'}
                </p>
              </div>
              <button 
                onClick={handleGetLocation} 
                disabled={locationStatus === 'calibrating'}
                className="location-btn btn-primary"
              >
                {locationStatus === 'calibrating' ? 'CALIBRATING...' : 'SHARE MY LOCATION'}
              </button>
            </div>
          </section>
        )}

        {/* State 2: Dashboard Content (Rendered only when access is granted) */}
        {locationStatus === 'granted' && (
          <div className="ns-dashboard-container">
            
            {/* Location Status Bar */}
            <div className="location-status-bar glass-panel">
              <div className="status-location-info">
                <span className="material-symbols-outlined text-primary">my_location</span>
                <span className="status-location-name font-body-md">{locationName}</span>
              </div>
              <div className="status-live-badge">
                <div className="pulse-dot"></div>
                <span className="live-badge-text">LIVE FEED</span>
              </div>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="ns-dashboard-grid">
              
              {/* Moon Phase Card */}
              <div className="grid-card moon-card col-span-8 glass-panel">
                <div className="card-content-left">
                  <div className="card-header">
                    <span className="card-tag uppercase">LUNAR CYCLE</span>
                    <h2 className="card-title text-headline-lg">{moonData ? moonData.curphase : 'Loading...'}</h2>
                  </div>
                  <div className="moon-illumination">
                    <span className="illumination-percent text-primary">{moonData ? moonData.fracillum : '--'}</span>
                    <span className="illumination-text text-on-surface-variant">Illuminated surface visible.</span>
                  </div>
                  <div className="moon-metrics-grid">
                    <div className="metric-box">
                      <span className="metric-label">RISE</span>
                      <div className="metric-value">{moonData?.moondata?.find((m: any) => m.phen === 'Rise')?.time || '--'}</div>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">SET</span>
                      <div className="metric-value">{moonData?.moondata?.find((m: any) => m.phen === 'Set')?.time || '--'}</div>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">DIST.</span>
                      <div className="metric-value">384k km</div>
                    </div>
                  </div>
                </div>
                <div className="moon-graphic-wrapper">
                  <div className="moon-graphic-glow"></div>
                  <svg className="moon-svg" viewBox="0 0 100 100">
                    <defs>
                      <radialGradient id="moonGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#E0E0E0" />
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="url(#moonGradient)" />
                    {/* Shadow overlay matching waxing gibbous phase */}
                    <path d="M 50 5 A 45 45 0 0 0 50 95 A 25 45 0 0 1 50 5" fill="#050A14" fillOpacity="0.85" />
                  </svg>
                </div>
              </div>

              {/* Sun & Daylight Card */}
              <div className="grid-card sun-card col-span-4 glass-panel">
                <div className="card-header-row">
                  <div className="card-header">
                    <span className="card-tag uppercase">SOLAR POSITION</span>
                    <h2 className="card-title text-headline-md">Sun Arc</h2>
                  </div>
                  <span className="material-symbols-outlined text-secondary">light_mode</span>
                </div>
                
                <div className="sun-arc-wrapper">
                  <svg className="sun-arc-svg" viewBox="0 0 200 100">
                    {/* Daylight Arc */}
                    <path d="M 10 90 Q 100 10 190 90" fill="none" stroke="rgba(254, 201, 49, 0.2)" strokeDasharray="4 2" strokeWidth="2" />
                    {/* Horizon line */}
                    <line x1="0" y1="90" x2="200" y2="90" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                    {/* Sun Icon (Positioned by current time calculations) */}
                    <circle cx={sunX} cy={sunY} r="6" fill="#fec931" className="sun-marker-glow">
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                  <div className="sun-arc-labels">
                    <span>{moonData?.sundata?.find((s: any) => s.phen === 'Rise')?.time || '06:12'}</span>
                    <span>{moonData?.sundata?.find((s: any) => s.phen === 'Set')?.time || '18:34'}</span>
                  </div>
                </div>

                <div className="sun-details-row">
                  <span>Altitude: {sunAltitude}°</span>
                  <span>Azimuth: {sunAzimuth}°</span>
                </div>
              </div>

              {/* Visible Planets Grid */}
              <div className="grid-card col-span-12 planet-list-container">
                <div className="planets-wrapper-grid">
                  {isLoading ? (
                     <div className="loading-text">Scanning planetary frequencies...</div>
                  ) : planetsData && planetsData.length > 0 ? (
                    planetsData.map((planet: any, idx: number) => {
                      const name = planet.name || 'Unknown';
                      const magNum = planet.magnitude;
                      const mag = magNum !== null && magNum !== undefined ? (magNum > 0 ? `+${magNum}` : `${magNum}`) : '--';
                      const altNum = planet.altitude;
                      const alt = altNum !== null && altNum !== undefined ? Math.round(altNum) + '°' : '--';
                      const planetColorClass = name.toLowerCase() + '-color';
                      
                      return (
                        <div key={idx} className="planet-card glass-panel">
                          <div className={`planet-circle-wrapper ${name.toLowerCase() === 'saturn' ? 'saturn-wrapper' : ''}`}>
                            <div className={`planet-circle ${planetColorClass}`}></div>
                            {name.toLowerCase() === 'saturn' && <div className="saturn-ring"></div>}
                          </div>
                          <div className="planet-info">
                            <h3 className="planet-name text-headline-sm">{name}</h3>
                            <div className="planet-stats">
                              <span>Mag: {mag}</span>
                              <span>Alt: {alt}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="loading-text">No visible planets data available.</div>
                  )}
                </div>
              </div>

              {/* Constellation Sky Chart */}
              <div className="grid-card col-span-8 sky-chart-card glass-panel">
                <div className="sky-chart-header">
                  <span className="card-tag uppercase">SKY CHART</span>
                  <h2 className="card-title text-headline-md">Zenith Perspective</h2>
                </div>
                
                <div className="sky-compass">
                  <span className="compass-direction">N</span>
                  <div className="compass-axis-x"></div>
                  <div className="compass-axis-y"></div>
                </div>

                <div className="sky-chart-container">
                  {/* Background/Dynamic Stars and Planets drawn on Canvas */}
                  <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={450} 
                    className="sky-chart-svg" 
                  />
                </div>
              </div>

              {/* ISS Pass Times Card */}
              <div className="grid-card col-span-4 iss-tracking-card glass-panel">
                <div className="card-header-row">
                  <div className="card-header">
                    <span className="card-tag uppercase">SATELLITE TRACKING</span>
                    <h2 className="card-title text-headline-md">ISS Passages</h2>
                  </div>
                  <span className="material-symbols-outlined text-secondary">satellite_alt</span>
                </div>

                <div className="iss-passes-list">
                  {isLoading ? (
                    <div className="loading-text">Acquiring satellite vectors...</div>
                  ) : issPasses && issPasses.length > 0 ? (
                    issPasses.map((pass, index) => (
                      <div key={index} className="iss-pass-item">
                        <div className="pass-info">
                          <div className="pass-time font-body-md">{pass.time}</div>
                          <div className="pass-coords font-label-sm">
                            Elev: {pass.elev} | {pass.dir}
                          </div>
                        </div>
                        <span className="pass-duration">{pass.duration}</span>
                      </div>
                    ))
                  ) : (
                    <div className="loading-text">No upcoming passes found.</div>
                  )}
                </div>

                <button 
                  onClick={() => window.open('https://www.nasa.gov/spot-the-station/#Tracker', '_blank')}
                  className="iss-notify-btn"
                >
                  <span className="material-symbols-outlined">
                    satellite_alt
                  </span>
                  <span>Track ISS with NASA</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NightSky;
