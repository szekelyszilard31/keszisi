import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

function EmailTestCard() {
  const [testEmail, setTestEmail] = React.useState('');
  const [sending, setSending]     = React.useState(false);
  const [result, setResult]       = React.useState(null);

  const sendTest = async () => {
    if (!testEmail) return;
    setSending(true); setResult(null);
    try {
      const res = await API.post('/admin/test-email', { to: testEmail });
      setResult({ ok: true, msg: res.data.message });
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.error || 'Hiba történt.' });
    } finally { setSending(false); }
  };

  return (
    <div className="card">
      <div className="card__title"><h2>📧 Teszt email küldése</h2></div>
      <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
        Küldj egy teszt visszaigazoló emailt hogy ellenőrizd az email rendszer működését.
        Fontos: előbb be kell állítani az App Password-öt a <code>backend/mailer.js</code> fájlban.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
          <label className="form-label">Teszt email cím</label>
          <input className="form-input" type="email" placeholder="sajat@email.hu"
            value={testEmail} onChange={e => setTestEmail(e.target.value)} />
        </div>
        <button className="btn btn--primary" onClick={sendTest} disabled={sending || !testEmail}>
          {sending ? '⏳ Küldés...' : '📨 Teszt küldése'}
        </button>
      </div>
      {result && (
        <div className={`alert ${result.ok ? 'alert--success' : 'alert--error'}`} style={{ marginTop: '0.75rem' }}>
          {result.msg}
        </div>
      )}
      <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'rgba(240,192,96,0.08)',
                    border: '1px solid rgba(240,192,96,0.25)', borderRadius: '8px',
                    fontSize: '0.8rem', color: 'var(--c-warn)' }}>
        <strong>⚙️ Beállítás szükséges:</strong> Nyisd meg a <code>backend/mailer.js</code> fájlt,
        és az <code>IDE_IRD_AZ_APP_PASSWORDT</code> sort cseréld le a Gmail App Password-re
        (16 karakteres kód a Google fiókodból).
      </div>
    </div>
  );
}

export default function AdminDocuments() {
  const [docs, setDocs]         = useState({});
  const [uploading, setUploading] = useState({});
  const [messages, setMessages]  = useState({});
  const gdprRef     = useRef();
  const liabilityRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/documents').then(r => setDocs(r.data)).catch(() => {});
  }, []);

  const upload = async (docType, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [docType]: true }));
    setMessages(m => ({ ...m, [docType]: '' }));

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await API.post(`/admin/documents/${docType}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocs(d => ({ ...d, [docType]: res.data.url }));
      setMessages(m => ({ ...m, [docType]: 'success' }));
    } catch (err) {
      setMessages(m => ({ ...m, [docType]: err.response?.data?.error || 'Hiba történt.' }));
    } finally {
      setUploading(u => ({ ...u, [docType]: false }));
    }
  };

  const logout = () => {
    localStorage.removeItem('keszisi_token');
    navigate('/admin/login');
  };

  const DocCard = ({ docType, label, description, fileRef }) => (
    <div className="card">
      <div className="card__title"><h2>{label}</h2></div>
      <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{description}</p>

      {docs[docType] ? (
        <div className="alert alert--success" style={{ marginBottom: '1rem' }}>
          ✅ Dokumentum feltöltve —{' '}
          <a href={docs[docType]} target="_blank" rel="noreferrer">Megtekintés</a>
        </div>
      ) : (
        <div className="alert alert--info" style={{ marginBottom: '1rem' }}>
          ℹ️ Még nincs feltöltve. Az ügyfélen a checkbox szöveg látható, de a link nem kattintható.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={e => upload(docType, e.target.files[0])}
        />
        <button className="btn btn--primary"
          onClick={() => fileRef.current.click()}
          disabled={uploading[docType]}>
          {uploading[docType] ? '⏳ Feltöltés...' : (docs[docType] ? '🔄 Csere' : '📤 PDF feltöltése')}
        </button>
        {docs[docType] && (
          <a href={docs[docType]} target="_blank" rel="noreferrer"
            className="btn btn--secondary">
            👁 Megtekintés
          </a>
        )}
      </div>

      {messages[docType] && messages[docType] !== 'success' && (
        <div className="alert alert--error" style={{ marginTop: '0.75rem' }}>{messages[docType]}</div>
      )}
    </div>
  );

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo.webp" alt="Keszisi" style={{height:'32px',width:'auto',display:'inline',marginRight:'8px',verticalAlign:'middle',filter:'brightness(0) invert(1)',opacity:0.9}} />
          Admin
        </div>
        <nav className="admin-nav">
          <a href="/admin">📋 Foglalások</a>
          <a href="/admin/documents" className="active">📄 Dokumentumok</a>
          {localStorage.getItem('keszisi_role') === 'superadmin' && (
            <a href="/admin/users">👥 Felhasználók</a>
          )}
        </nav>
        <div style={{ position: 'absolute', bottom: '1rem', padding: '0 1.25rem', width: 220 }}>
          <button className="btn btn--ghost btn--full" onClick={logout} style={{ fontSize: '0.8rem' }}>
            Kilépés
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <h2 style={{ marginBottom: '1.5rem' }}>Dokumentumok kezelése</h2>

        <DocCard
          docType="gdpr"
          label="📋 Adatkezelési tájékoztató (GDPR)"
          description="Az ügyfél az adatmegadási form utolsó lépésénél láthatja és elolvashatja ezt a dokumentumot, mielőtt pipálja az elfogadást."
          fileRef={gdprRef}
        />

        <DocCard
          docType="liability"
          label="⚠️ Felelősségi nyilatkozat"
          description="A kölcsönzött eszközök állapotára vonatkozó felelősségvállalási nyilatkozat. Az ügyfél ezt is elfogadja a kitöltés végén."
          fileRef={liabilityRef}
        />

        <div className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--c-border)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--c-grey)' }}>
            <strong style={{color:'var(--c-white)'}}>Megjegyzés:</strong> A feltöltött PDF fájlok azonnal elérhetővé válnak az ügyfél oldali formon.
            Maximum 10 MB méretű fájlok tölthetők fel. Ha cserél egy dokumentumot, a régi automatikusan felülíródik.
          </p>
        </div>

        <EmailTestCard />
      </main>
    </div>
  );
}
