import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../utils/api';
import { downloadBookingPDF } from '../utils/pdfGenerator';

const STATUS_LABELS = {
  new: 'Új', confirmed: 'Visszaigazolt',
  completed: 'Teljesített', cancelled: 'Törölt'
};

const SKILL_LABELS = {
  elso_sielo: 'Első síelő', kezdo: 'Kezdő',
  kozephalado: 'Középhaladó', halado: 'Haladó', profi: 'Profi'
};

export default function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try { await downloadBookingPDF(booking); }
    catch (e) { alert('PDF hiba: ' + e.message); }
    finally { setPdfLoading(false); }
  };

  useEffect(() => {
    API.get(`/admin/bookings/${id}`)
      .then(r => setBooking(r.data))
      .catch(() => navigate('/admin'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const updateStatus = async (status) => {
    setSaving(true);
    await API.patch(`/admin/bookings/${id}/status`, { status });
    setBooking(b => ({ ...b, status }));
    setSaving(false);
  };

  const deleteBooking = async () => {
    if (!window.confirm('Biztosan törli ezt a foglalást?')) return;
    setDeleting(true);
    await API.delete(`/admin/bookings/${id}`);
    navigate('/admin');
  };

  const formatDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('hu-HU') : '—';
  const formatDateTime = d => d ? new Date(d).toLocaleString('hu-HU') : '—';

  const logout = () => {
    localStorage.removeItem('keszisi_token');
    navigate('/admin/login');
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Betöltés...</div>;
  if (!booking) return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo.webp" alt="Keszisi" style={{height:'32px',width:'auto',display:'inline',marginRight:'8px',verticalAlign:'middle',filter:'brightness(0) invert(1)',opacity:0.9}} />
          Admin
        </div>
        <nav className="admin-nav">
          <a href="/admin">📋 Foglalások</a>
          <a href="/admin/documents">📄 Dokumentumok</a>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin" className="btn btn--ghost" style={{ fontSize: '0.85rem' }}>← Vissza</Link>
          <h2 style={{ flex: 1 }}>Foglalás #{booking.id}</h2>
          <span className={`status-badge ${booking.status}`} style={{ fontSize: '0.9rem', padding: '0.3rem 0.9rem' }}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        {/* Státusz módosítás */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '0.25rem' }}>Státusz:</span>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <button key={v}
                className={`btn ${booking.status === v ? 'btn--primary' : 'btn--ghost'}`}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                onClick={() => updateStatus(v)}
                disabled={saving}>
                {l}
              </button>
            ))}
            <button className="btn btn--danger"
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', marginLeft: 'auto' }}
              onClick={deleteBooking} disabled={deleting}>
              {deleting ? 'Törlés...' : '🗑 Foglalás törlése'}
            </button>
          </div>
        </div>

        {/* Bérlési adatok */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="card__title"><h2>📅 Bérlési időszak</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-mist)', fontWeight: 600 }}>ELVITEL</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatDate(booking.pickup_date)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-mist)', fontWeight: 600 }}>VISSZAHOZATAL</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatDate(booking.return_date)}</div>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--c-mist)' }}>
              Kitöltve: {formatDateTime(booking.created_at)}
            </div>
          </div>

          <div className="card">
            <div className="card__title"><h2>👤 Kapcsolattartó</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
              <div><strong>{booking.contact_name}</strong></div>
              <div style={{ color: 'var(--c-steel)' }}>📍 {booking.address_zip} {booking.address_city}, {booking.address_street} {booking.address_house}</div>
              <div><a href={`tel:${booking.contact_phone}`}>📞 {booking.contact_phone}</a></div>
              <div><a href={`mailto:${booking.contact_email}`}>✉️ {booking.contact_email}</a></div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--c-mist)' }}>
                GDPR: {booking.gdpr_accepted ? '✅ Elfogadva' : '❌'}
                {' | '}
                Felelősség: {booking.liability_accepted ? '✅ Elfogadva' : '❌'}
              </div>
            </div>
          </div>
        </div>

        {/* Bérlők táblázata */}
        <div className="card">
          <div className="card__title"><h2>🎿 Bérlők és DIN értékek</h2></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Név</th>
                  <th>Kor</th>
                  <th>Magasság</th>
                  <th>Súly</th>
                  <th>Lábméret</th>
                  <th>Sítudás</th>
                  <th>DIN érték</th>
                </tr>
              </thead>
              <tbody>
                {booking.renters?.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--c-mist)' }}>{i + 1}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.age} év</td>
                    <td>{r.height_cm} cm</td>
                    <td>{r.weight_kg} kg</td>
                    <td>EU {r.shoe_size}</td>
                    <td>{SKILL_LABELS[r.skill_level] || r.skill_level}</td>
                    <td>
                      <span className="din-badge">{Number(r.din_value).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Aláírás */}
        {booking.signature_data && (
          <div className="card">
            <div className="card__title"><h2>✍️ Ügyfél aláírása</h2></div>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '1rem',
                          border: '1px solid var(--c-border)', maxWidth: 400 }}>
              <img src={booking.signature_data} alt="Aláírás"
                style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
