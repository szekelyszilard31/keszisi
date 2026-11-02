import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

export default function LoginPage() {
  const [tab, setTab]             = useState('login');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/setup-status').then(r => setNeedsSetup(r.data.needsSetup)).catch(() => {});
  }, []);

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await API.post('/login', { username, password });
      localStorage.setItem('keszisi_token', res.data.token);
      localStorage.setItem('keszisi_role', res.data.role);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Hiba történt.');
    } finally { setLoading(false); }
  };

  const handleSetup = async () => {
    setError(''); setLoading(true);
    try {
      if (password.length < 6) { setError('Legalább 6 karakteres jelszó szükséges.'); setLoading(false); return; }
      await API.post('/setup', { username, email, password });
      setSuccess('Fiók létrehozva! Most már be tudsz lépni.');
      setNeedsSetup(false); setTab('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Hiba történt.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError(''); setLoading(true);
    try {
      if (!username || !email || !password) { setError('Minden mező kötelező.'); setLoading(false); return; }
      if (password.length < 6) { setError('Legalább 6 karakteres jelszó szükséges.'); setLoading(false); return; }
      if (password !== password2) { setError('A két jelszó nem egyezik.'); setLoading(false); return; }
      await API.post('/register', { username, email, password });
      setSuccess('Regisztrációd megérkezett! A szuper admin jóváhagyása után tudsz belépni — erről értesítést kapsz.');
      setUsername(''); setEmail(''); setPassword(''); setPassword2('');
    } catch (err) {
      setError(err.response?.data?.error || 'Hiba történt.');
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (needsSetup) handleSetup();
      else if (tab === 'login') handleLogin();
      else handleRegister();
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--c-bg)', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <img src="/logo.webp" alt="Keszisi logó"
            style={{ height:70, filter:'brightness(0) invert(1)', opacity:0.9, marginBottom:'1rem' }} />
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem',
            fontWeight:800, color:'var(--c-white)', letterSpacing:'0.08em' }}>
            KESZISI<span style={{color:'var(--c-grey2)'}}>.</span>HU
          </div>
          <div style={{ fontSize:'0.75rem', color:'var(--c-grey2)', marginTop:4 }}>
            Admin felület
          </div>
        </div>

        <div className="card">
          {/* Tabok — csak ha nem setup mód */}
          {!needsSetup && (
            <div style={{ display:'flex', gap:'2px', marginBottom:'1.5rem',
              background:'var(--c-surface2)', borderRadius:'var(--radius)', padding:'3px' }}>
              {['login','register'].map(t => (
                <button key={t}
                  onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                  style={{
                    flex:1, padding:'0.5rem', border:'none', cursor:'pointer',
                    borderRadius:'6px', fontSize:'0.85rem', fontWeight:600,
                    fontFamily:'var(--font-body)',
                    background: tab === t ? 'var(--c-white)' : 'transparent',
                    color: tab === t ? 'var(--c-bg)' : 'var(--c-grey2)',
                    transition:'all 0.15s',
                  }}>
                  {t === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
                </button>
              ))}
            </div>
          )}

          {needsSetup && (
            <div className="alert alert--info" style={{ marginBottom:'1rem', fontSize:'0.82rem' }}>
              👋 Első indítás — hozz létre egy admin fiókot.
            </div>
          )}

          {success && <div className="alert alert--success" style={{ marginBottom:'1rem' }}>{success}</div>}
          {error   && <div className="alert alert--error"   style={{ marginBottom:'1rem' }}>{error}</div>}

          {/* Bejelentkezés */}
          {(tab === 'login' || needsSetup) && (
            <>
              <div className="form-group">
                <label className="form-label">Felhasználónév</label>
                <input className="form-input" type="text" value={username} placeholder="pl. szekely"
                  onChange={e => setUsername(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              {needsSetup && (
                <div className="form-group">
                  <label className="form-label">Email cím</label>
                  <input className="form-input" type="email" value={email} placeholder="pelda@email.hu"
                    onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Jelszó</label>
                <input className="form-input" type="password" value={password} placeholder="••••••••"
                  onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
              <button className="btn btn--primary btn--full" style={{ marginTop:'0.5rem' }}
                onClick={needsSetup ? handleSetup : handleLogin} disabled={loading}>
                {loading ? <><span className="spinner" /> ...</> : (needsSetup ? 'Fiók létrehozása' : 'Belépés')}
              </button>
            </>
          )}

          {/* Regisztráció */}
          {tab === 'register' && !needsSetup && (
            <>
              <div className="alert alert--info" style={{ marginBottom:'1rem', fontSize:'0.82rem' }}>
                A regisztráció jóváhagyást igényel. Az adminisztrátor e-mailben értesítést kap,
                és jóváhagyása után tudsz belépni.
              </div>
              <div className="form-group">
                <label className="form-label">Felhasználónév <span className="required">*</span></label>
                <input className="form-input" type="text" value={username} placeholder="pl. kovacs.peter"
                  onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email cím <span className="required">*</span></label>
                <input className="form-input" type="email" value={email} placeholder="pelda@email.hu"
                  onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Jelszó <span className="required">*</span></label>
                <input className="form-input" type="password" value={password} placeholder="legalább 6 karakter"
                  onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Jelszó mégegyszer <span className="required">*</span></label>
                <input className="form-input" type="password" value={password2} placeholder="••••••••"
                  onChange={e => setPassword2(e.target.value)} />
              </div>
              <button className="btn btn--primary btn--full" style={{ marginTop:'0.5rem' }}
                onClick={handleRegister} disabled={loading}>
                {loading ? <><span className="spinner" /> ...</> : 'Regisztrációs kérelem küldése'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
