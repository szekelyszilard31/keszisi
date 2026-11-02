import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function LandingPage() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  // Ha már be van lépve, irány az admin
  useEffect(() => {
    const token = localStorage.getItem('keszisi_token');
    if (token) navigate('/admin');
  }, [navigate]);

  const handleAdminLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await API.post('/login', { username, password });
      localStorage.setItem('keszisi_token', res.data.token);
      localStorage.setItem('keszisi_role', res.data.role);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Hibás felhasználónév vagy jelszó.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--c-bg)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Háttér - havas hegy SVG illusztráció */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 40%, #0f1525 100%)',
      }}>
        {/* Csillagok */}
        {[...Array(60)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
            background: 'white',
            borderRadius: '50%',
            top: Math.random() * 60 + '%',
            left: Math.random() * 100 + '%',
            opacity: Math.random() * 0.7 + 0.2,
          }} />
        ))}

        {/* Hegycsúcsok SVG */}
        <svg viewBox="0 0 1440 500" preserveAspectRatio="xMidYMax slice"
          style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'65%' }}
          xmlns="http://www.w3.org/2000/svg">
          {/* Háttér hegy - távolabbi */}
          <path d="M0,500 L0,320 L120,210 L200,260 L310,150 L400,200 L500,100 L600,180
                   L680,80 L760,150 L850,60 L940,130 L1020,50 L1100,120 L1200,200
                   L1300,130 L1380,180 L1440,150 L1440,500 Z"
            fill="#0d1525" opacity="0.9"/>
          {/* Középső hegyek - hóval */}
          <path d="M0,500 L0,380 L100,300 L180,340 L260,250 L340,300 L440,200
                   L520,260 L600,170 L680,230 L760,140 L840,200 L920,120
                   L1000,190 L1080,110 L1160,180 L1240,260 L1320,200 L1440,280 L1440,500 Z"
            fill="#111827" opacity="0.95"/>
          {/* Hó a csúcsokon */}
          <path d="M600,170 L580,185 L600,210 L620,185 Z M760,140 L740,158 L760,180 L780,158 Z
                   M920,120 L900,140 L920,162 L940,140 Z M1080,110 L1060,132 L1080,155 L1100,132 Z"
            fill="white" opacity="0.6"/>
          {/* Közeli hegyek - sötétebb */}
          <path d="M0,500 L0,420 L80,370 L160,400 L240,340 L340,390 L440,310
                   L560,370 L660,290 L780,360 L880,280 L1000,350 L1100,300
                   L1200,360 L1300,310 L1440,380 L1440,500 Z"
            fill="#0f172a"/>
          {/* Havas előtér */}
          <path d="M0,500 L0,460 C200,440 400,450 600,445 C800,440 1000,455 1200,448 C1300,445 1380,450 1440,448 L1440,500 Z"
            fill="#1a2540" opacity="0.8"/>
          {/* Hófelszín fény */}
          <path d="M0,470 C200,455 500,460 700,458 C900,456 1200,462 1440,460 L1440,465 C1200,467 900,461 700,463 C500,465 200,460 0,475 Z"
            fill="white" opacity="0.04"/>
        </svg>
      </div>

      {/* Tartalom */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem 1rem',
      }}>

        {/* Logó */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.webp" alt="Keszisi logó"
            style={{ height: 80, filter: 'brightness(0) invert(1)', opacity: 0.95,
                     marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 800, color: 'white', letterSpacing: '0.12em',
            margin: 0, textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            KESZISI<span style={{ color: 'rgba(255,255,255,0.4)' }}>.</span>HU
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem',
            letterSpacing: '0.08em', marginTop: '0.4rem',
          }}>
            Sí &amp; Kerékpár Szerviz · Dunakeszi
          </p>
        </div>

        {!showAdminLogin ? (
          /* Választó gombok */
          <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Ügyfél gomb */}
            <button
              onClick={() => navigate('/foglalas')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                padding: '1.5rem 2rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 52, height: 52, background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0,
              }}>⛷</div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem',
                  fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  Bérlési adatok kitöltése
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '3px' }}>
                  Ügyfélként folytatom — megadom az adataimat
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '1.2rem' }}>→</div>
            </button>

            {/* Admin gomb */}
            <button
              onClick={() => setShowAdminLogin(true)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                padding: '1.5rem 2rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 52, height: 52, background: 'rgba(255,255,255,0.08)',
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
              }}>🔐</div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: '1.1rem',
                  fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  Admin belépés
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginTop: '3px' }}>
                  Dolgozóként lépek be — megtekintés és kezelés
                </div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: '1.2rem' }}>→</div>
            </button>

            {/* Lábléc szöveg */}
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)',
              fontSize: '0.75rem', marginTop: '0.5rem' }}>
              2120 Dunakeszi, Katona József utca 23. · +36 30 459 5670
            </p>
          </div>

        ) : (
          /* Admin bejelentkezés panel */
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{
              background: 'rgba(15,15,23,0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => { setShowAdminLogin(false); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
                  ←
                </button>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'white',
                  fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  Admin belépés
                </h2>
              </div>

              {error && (
                <div className="alert alert--error" style={{ marginBottom: '1rem' }}>{error}</div>
              )}

              <div className="form-group">
                <label className="form-label">Felhasználónév</label>
                <input className="form-input" type="text" value={username}
                  placeholder="pl. szekelyszilard"
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
              </div>
              <div className="form-group">
                <label className="form-label">Jelszó</label>
                <input className="form-input" type="password" value={password}
                  placeholder="••••••••"
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
              </div>
              <button className="btn btn--primary btn--full" style={{ marginTop: '0.5rem' }}
                onClick={handleAdminLogin} disabled={loading}>
                {loading ? <><span className="spinner" style={{borderTopColor:'var(--c-bg)'}} /> Belépés...</> : 'Belépés'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => navigate('/admin/login')}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                    cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}>
                  Regisztrációs kérelem küldése
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
