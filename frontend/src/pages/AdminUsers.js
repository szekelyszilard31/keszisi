import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const ROLE_LABELS = { superadmin: '👑 Szuper Admin', admin: '🔧 Admin' };
const STATUS_LABELS = { approved: 'Aktív', pending: 'Jóváhagyásra vár' };

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('hu-HU', {
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'
  });
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [me, setMe]             = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, meRes] = await Promise.all([
        API.get('/admin/users'),
        API.get('/me'),
      ]);
      setUsers(uRes.data);
      setMe(meRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const logout = () => {
    localStorage.removeItem('keszisi_token');
    localStorage.removeItem('keszisi_role');
    navigate('/admin/login');
  };

  const handleApprove = async (id) => {
    try {
      await API.patch(`/admin/users/${id}/approve`);
      fetchData();
    } catch (e) { alert(e.response?.data?.error || 'Hiba'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await API.patch(`/admin/users/${id}/role`, { role });
      fetchData();
    } catch (e) { alert(e.response?.data?.error || 'Hiba'); }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Biztosan törlöd a(z) "${username}" fiókot?`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      fetchData();
    } catch (e) { alert(e.response?.data?.error || 'Hiba'); }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo.webp" alt="Keszisi" style={{height:'32px',width:'auto',display:'inline',
            marginRight:'8px',verticalAlign:'middle',filter:'brightness(0) invert(1)',opacity:0.9}} />
          Admin
        </div>
        <nav className="admin-nav">
          <a href="/admin">📋 Foglalások</a>
          <a href="/admin/documents">📄 Dokumentumok</a>
          <a href="/admin/users" className="active">👥 Felhasználók</a>
        </nav>
        <div style={{ position:'absolute', bottom:'1rem', padding:'0 1.25rem', width:220 }}>
          <button className="btn btn--ghost btn--full" onClick={logout} style={{ fontSize:'0.8rem' }}>
            Kilépés
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h2>Felhasználók kezelése</h2>
          {me && (
            <span style={{ fontSize:'0.8rem', color:'var(--c-grey2)' }}>
              Bejelentkezve: <strong style={{ color:'var(--c-white)' }}>{me.username}</strong>
              {' '}<span style={{ color:'var(--c-warn)' }}>({ROLE_LABELS[me.role]})</span>
            </span>
          )}
        </div>

        {/* Jóváhagyásra váró fiók figyelmeztető */}
        {users.some(u => u.status === 'pending') && (
          <div className="alert alert--info" style={{ marginBottom:'1rem' }}>
            ⚠️ Van jóváhagyásra váró regisztrációs kérelem!
          </div>
        )}

        {loading ? (
          <p style={{ textAlign:'center', padding:'2rem', color:'var(--c-grey2)' }}>Betöltés...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Felhasználónév</th>
                  <th>Email</th>
                  <th>Szerepkör</th>
                  <th>Státusz</th>
                  <th>Regisztrált</th>
                  <th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color:'var(--c-grey2)', fontSize:'0.78rem' }}>{u.id}</td>
                    <td>
                      <strong style={{ color:'var(--c-white)' }}>{u.username}</strong>
                      {me?.id === u.id && (
                        <span style={{ marginLeft:6, fontSize:'0.72rem',
                          background:'rgba(255,255,255,0.1)', padding:'1px 6px',
                          borderRadius:'99px', color:'var(--c-grey)' }}>te</span>
                      )}
                    </td>
                    <td style={{ fontSize:'0.82rem' }}>{u.email}</td>
                    <td>
                      {me?.id !== u.id ? (
                        <div className="select-wrapper" style={{ maxWidth:160 }}>
                          <select className="form-select"
                            style={{ padding:'0.3rem 0.6rem', fontSize:'0.78rem' }}
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}>
                            <option value="admin">🔧 Admin</option>
                            <option value="superadmin">👑 Szuper Admin</option>
                          </select>
                        </div>
                      ) : (
                        <span style={{ fontSize:'0.82rem' }}>{ROLE_LABELS[u.role]}</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display:'inline-block', padding:'0.2rem 0.6rem',
                        borderRadius:'99px', fontSize:'0.75rem', fontWeight:600,
                        background: u.status === 'approved'
                          ? 'rgba(107,203,139,0.15)' : 'rgba(240,192,96,0.15)',
                        color: u.status === 'approved'
                          ? 'var(--c-success)' : 'var(--c-warn)',
                      }}>
                        {STATUS_LABELS[u.status] || u.status}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.78rem' }}>{formatDateTime(u.created_at)}</td>
                    <td>
                      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                        {u.status === 'pending' && (
                          <button className="btn btn--primary"
                            style={{ fontSize:'0.75rem', padding:'0.25rem 0.75rem' }}
                            onClick={() => handleApprove(u.id)}>
                            ✓ Jóváhagyás
                          </button>
                        )}
                        {me?.id !== u.id && (
                          <button className="btn btn--danger"
                            style={{ fontSize:'0.75rem', padding:'0.25rem 0.75rem' }}
                            onClick={() => handleDelete(u.id, u.username)}>
                            Törlés
                          </button>
                        )}
                        {me?.id === u.id && (
                          <span style={{ fontSize:'0.75rem', color:'var(--c-grey2)' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card" style={{ marginTop:'1.5rem', background:'rgba(255,255,255,0.03)' }}>
          <p style={{ fontSize:'0.82rem', color:'var(--c-grey2)', lineHeight:1.7 }}>
            <strong style={{ color:'var(--c-white)' }}>💡 Szuper admin beállítása:</strong><br/>
            A szuper admin jogkört a backend konzolban kell beállítani. Másold be az alábbi parancsot
            a backend PowerShell ablakába (a saját felhasználónevedre cserélve):
          </p>
          <div style={{ marginTop:'0.75rem', background:'var(--c-surface2)', borderRadius:'var(--radius)',
            padding:'0.75rem 1rem', fontFamily:'monospace', fontSize:'0.78rem', color:'var(--c-accent2)',
            overflowX:'auto', whiteSpace:'nowrap' }}>
            node -e "const D=require('./db');const db=D.initDB();D.dbRun(db,`UPDATE admin_users SET role='superadmin' WHERE username='FELHASZNALONEV'`).then(()=&gt;&#123;console.log('Kész!');process.exit()&#125;)"
          </div>
        </div>
      </main>
    </div>
  );
}
