import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { downloadBookingPDF, downloadMultiplePDFs } from '../utils/pdfGenerator';

const STATUS_LABELS = {
  new: 'Új', confirmed: 'Visszaigazolt',
  completed: 'Teljesített', cancelled: 'Törölt'
};
const SKILL_LABELS = {
  elso_sielo: 'Első síelő', kezdo: 'Kezdő', kozephalado: 'Középhaladó',
  halado: 'Haladó', profi: 'Profi'
};

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${y}.${m}.${day}.`;
}
function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('hu-HU', {
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit'
  });
}

// Hook: képernyőszélesség figyelése
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

// Mobil kártya nézet egy foglaláshoz
function BookingCard({ b, selected, onToggle, onPdf, pdfLoading }) {
  return (
    <div style={{
      background: selected ? 'rgba(255,255,255,0.06)' : 'var(--c-surface)',
      border: `1px solid ${selected ? 'rgba(255,255,255,0.3)' : 'var(--c-border)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '1rem',
      marginBottom: '0.75rem',
      transition: 'all 0.15s',
    }}>
      {/* Fejléc sor */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', marginBottom:'0.75rem' }}>
        <input type="checkbox" checked={selected} onChange={onToggle}
          style={{ marginTop: 3, accentColor:'white', flexShrink:0, width:16, height:16 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, color:'var(--c-white)', fontSize:'1rem',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {b.contact_name}
          </div>
          <div style={{ fontSize:'0.75rem', color:'var(--c-grey2)', marginTop:2 }}>
            #{b.id} · {formatDateTime(b.created_at)}
          </div>
        </div>
        <span className={`status-badge ${b.status}`}>{STATUS_LABELS[b.status]}</span>
      </div>

      {/* Adatok rács */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem',
        marginBottom:'0.875rem' }}>
        <div style={{ background:'var(--c-surface2)', borderRadius:'var(--radius)',
          padding:'0.5rem 0.75rem' }}>
          <div style={{ fontSize:'0.68rem', color:'var(--c-grey2)', marginBottom:2 }}>ÁTVÉTEL</div>
          <div style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--c-white)' }}>
            {formatDate(b.pickup_date)}
          </div>
        </div>
        <div style={{ background:'var(--c-surface2)', borderRadius:'var(--radius)',
          padding:'0.5rem 0.75rem' }}>
          <div style={{ fontSize:'0.68rem', color:'var(--c-grey2)', marginBottom:2 }}>VISSZAHOZATAL</div>
          <div style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--c-white)' }}>
            {formatDate(b.return_date)}
          </div>
        </div>
        <div style={{ background:'var(--c-surface2)', borderRadius:'var(--radius)',
          padding:'0.5rem 0.75rem' }}>
          <div style={{ fontSize:'0.68rem', color:'var(--c-grey2)', marginBottom:2 }}>BÉRLŐK</div>
          <div style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--c-white)' }}>
            {b.renter_count} fő
          </div>
        </div>
        <div style={{ background:'var(--c-surface2)', borderRadius:'var(--radius)',
          padding:'0.5rem 0.75rem' }}>
          <div style={{ fontSize:'0.68rem', color:'var(--c-grey2)', marginBottom:2 }}>NYILATKOZATOK</div>
          <div style={{ fontSize:'0.82rem' }}>
            {b.gdpr_accepted ? '✅' : '❌'} GDPR &nbsp;
            {b.liability_accepted ? '✅' : '❌'} Felel.
          </div>
        </div>
      </div>

      {/* Email / telefon */}
      <div style={{ fontSize:'0.78rem', color:'var(--c-grey2)', marginBottom:'0.875rem',
        display:'flex', flexDirection:'column', gap:3 }}>
        <span>📞 {b.contact_phone}</span>
        <span>✉️ {b.contact_email}</span>
        <span>📍 {b.address_zip} {b.address_city}, {b.address_street} {b.address_house}</span>
      </div>

      {/* Gombok */}
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <Link to={`/admin/bookings/${b.id}`}
          className="btn btn--secondary"
          style={{ flex:1, fontSize:'0.82rem', padding:'0.5rem', justifyContent:'center' }}>
          Részletek
        </Link>
        <button className="btn btn--ghost"
          style={{ flex:1, fontSize:'0.82rem', padding:'0.5rem' }}
          onClick={() => onPdf(b)}
          disabled={pdfLoading}>
          {pdfLoading ? '⏳' : '📄 PDF'}
        </button>
      </div>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(new Set());
  const [search, setSearch]         = useState('');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pdfLoading, setPdfLoading] = useState({});
  const [exporting, setExporting]   = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (from)   params.from = from;
      if (to)     params.to = to;
      if (statusFilter) params.status = statusFilter;
      const [bRes, sRes] = await Promise.all([
        API.get('/admin/bookings', { params }),
        API.get('/admin/stats')
      ]);
      setBookings(bRes.data);
      setStats(sRes.data);
      setSelected(new Set());
    } catch {}
    finally { setLoading(false); }
  }, [search, from, to, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logout = () => {
    localStorage.removeItem('keszisi_token');
    localStorage.removeItem('keszisi_role');
    navigate('/admin/login');
  };

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const toggleAll = () => {
    if (selected.size === bookings.length) setSelected(new Set());
    else setSelected(new Set(bookings.map(b => b.id)));
  };

  const handlePdfDownload = async (booking) => {
    setPdfLoading(l => ({ ...l, [booking.id]: true }));
    try {
      const res = await API.get(`/admin/bookings/${booking.id}`);
      await downloadBookingPDF(res.data);
    } catch (e) { alert('PDF hiba: ' + e.message); }
    finally { setPdfLoading(l => ({ ...l, [booking.id]: false })); }
  };

  const handlePdfMulti = async (all = false) => {
    const targets = all ? bookings : bookings.filter(b => selected.has(b.id));
    if (!targets.length) return;
    setExporting(true);
    try {
      const detailed = await Promise.all(targets.map(b => API.get(`/admin/bookings/${b.id}`).then(r => r.data)));
      await downloadMultiplePDFs(detailed);
    } catch (e) { alert('PDF hiba: ' + e.message); }
    finally { setExporting(false); }
  };

  const handleExcelExport = async (all = false) => {
    const targets = all ? bookings : bookings.filter(b => selected.has(b.id));
    if (!targets.length) return;
    setExporting(true);
    try {
      const detailed = await Promise.all(targets.map(b => API.get(`/admin/bookings/${b.id}`).then(r => r.data)));
      const header = ['Azonosító','Kitöltve','Státusz','Ügyfél neve','Irányítószám','Város',
        'Utca','Házszám','Telefon','Email','Átvétel','Visszahozatal','GDPR','Felelősség',
        'Bérlő #','Bérlő neve','Kor','Magasság (cm)','Súly (kg)','Lábméret (EU)','Sítudás','DIN érték'
      ].join(';');
      const rows = [];
      detailed.forEach(b => {
        const base = [b.id, formatDateTime(b.created_at), STATUS_LABELS[b.status]||b.status,
          b.contact_name, b.address_zip, b.address_city, b.address_street, b.address_house,
          b.contact_phone, b.contact_email, formatDate(b.pickup_date), formatDate(b.return_date),
          b.gdpr_accepted?'Igen':'Nem', b.liability_accepted?'Igen':'Nem'];
        if (b.renters?.length > 0) {
          b.renters.forEach((r, i) => {
            rows.push([...base, i+1, r.name, r.age, r.height_cm, r.weight_kg,
              r.shoe_size, SKILL_LABELS[r.skill_level]||r.skill_level,
              Number(r.din_value).toFixed(2)].join(';'));
          });
        } else {
          rows.push([...base,'','','','','','','',''].join(';'));
        }
      });
      const csv = '\uFEFF' + [header, ...rows].join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KESZISI_foglalasok_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export hiba: ' + e.message); }
    finally { setExporting(false); }
  };

  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); setStatusFilter(''); };

  const Sidebar = () => (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__logo">
        <img src="/logo.webp" alt="Keszisi" style={{height:'32px',width:'auto',display:'inline',
          marginRight:'8px',verticalAlign:'middle',filter:'brightness(0) invert(1)',opacity:0.9}} />
        Admin
      </div>
      <nav className="admin-nav">
        <a href="/admin" className="active">📋 Foglalások</a>
        <a href="/admin/documents">📄 Dokumentumok</a>
        {localStorage.getItem('keszisi_role') === 'superadmin' && (
          <a href="/admin/users">👥 Felhasználók</a>
        )}
      </nav>
      <div style={{ position:'absolute', bottom:'1rem', padding:'0 1.25rem', width:220 }}>
        <button className="btn btn--ghost btn--full" onClick={logout} style={{ fontSize:'0.8rem' }}>
          Kilépés
        </button>
      </div>
    </aside>
  );

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">

        {/* Statisztikák */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom:'1.25rem' }}>
            <div className="stat-card">
              <div className="stat-card__value">{stats.total_bookings}</div>
              <div className="stat-card__label">Összes előjegyzés</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.today_bookings}</div>
              <div className="stat-card__label">Mai kitöltések</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{stats.total_renters}</div>
              <div className="stat-card__label">Összes bérlő</div>
            </div>
          </div>
        )}

        {/* Szűrők - mobilon összecsukható */}
        <div className="card" style={{ padding:'1rem', marginBottom:'1rem' }}>
          {isMobile ? (
            <>
              <button
                className="btn btn--ghost btn--full"
                onClick={() => setFiltersOpen(o => !o)}
                style={{ marginBottom: filtersOpen ? '1rem' : 0 }}>
                🔍 Szűrők {search||from||to||statusFilter ? '(aktív)' : ''} {filtersOpen ? '▲' : '▼'}
              </button>
              {filtersOpen && <FilterFields
                search={search} setSearch={setSearch}
                from={from} setFrom={setFrom}
                to={to} setTo={setTo}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                onClear={clearFilters} isMobile={true} />}
            </>
          ) : (
            <FilterFields
              search={search} setSearch={setSearch}
              from={from} setFrom={setFrom}
              to={to} setTo={setTo}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              onClear={clearFilters} isMobile={false} />
          )}
        </div>

        {/* Export eszköztár */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap',
          marginBottom:'1rem', alignItems:'center' }}>
          {selected.size > 0 && (
            <span style={{ fontSize:'0.8rem', color:'var(--c-grey2)', width:'100%' }}>
              {selected.size} kijelölve
            </span>
          )}
          <button className="btn btn--ghost"
            style={{ fontSize:'0.8rem', padding:'0.4rem 0.75rem' }}
            onClick={() => handleExcelExport(selected.size === 0)} disabled={exporting}>
            📊 {selected.size > 0 ? 'Kijelöltek' : 'Összes'} → Excel
          </button>
          <button className="btn btn--ghost"
            style={{ fontSize:'0.8rem', padding:'0.4rem 0.75rem' }}
            onClick={() => handlePdfMulti(selected.size === 0)} disabled={exporting}>
            📥 {selected.size > 0 ? 'Kijelöltek' : 'Összes'} → PDF
          </button>
          {selected.size > 0 && (
            <button className="btn btn--ghost"
              style={{ fontSize:'0.8rem', padding:'0.4rem 0.75rem' }}
              onClick={() => setSelected(new Set())}>
              ✕ Törlés
            </button>
          )}
          {exporting && <span style={{ fontSize:'0.8rem', color:'var(--c-grey2)' }}>⏳</span>}
        </div>

        {/* Tartalom */}
        {loading ? (
          <p style={{ textAlign:'center', padding:'2rem', color:'var(--c-grey2)' }}>Betöltés...</p>
        ) : bookings.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
            <p style={{ color:'var(--c-grey2)' }}>Nincs találat.</p>
          </div>
        ) : isMobile ? (
          /* ── MOBIL: Kártya nézet ── */
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.8rem', color:'var(--c-grey2)' }}>
                {bookings.length} foglalás
              </span>
              <button className="btn btn--ghost"
                style={{ fontSize:'0.78rem', padding:'0.3rem 0.75rem' }}
                onClick={toggleAll}>
                {selected.size === bookings.length ? 'Összes törlése' : 'Összes kijelölése'}
              </button>
            </div>
            {bookings.map(b => (
              <BookingCard key={b.id}
                b={b}
                selected={selected.has(b.id)}
                onToggle={() => toggleSelect(b.id)}
                onPdf={handlePdfDownload}
                pdfLoading={pdfLoading[b.id]} />
            ))}
          </div>
        ) : (
          /* ── ASZTALI: Táblázat nézet ── */
          <div className="table-wrapper" style={{ overflowX:'auto' }}>
            <table style={{ minWidth:1200 }}>
              <thead>
                <tr>
                  <th style={{ width:36 }}>
                    <input type="checkbox"
                      checked={selected.size === bookings.length && bookings.length > 0}
                      onChange={toggleAll}
                      style={{ accentColor:'white', cursor:'pointer' }} />
                  </th>
                  <th>#</th><th>Kitöltve</th><th>Ügyfél neve</th>
                  <th>Irsz.</th><th>Város</th><th>Utca</th><th>Hsz.</th>
                  <th>Telefon</th><th>Email</th>
                  <th>Átvétel</th><th>Visszahozatal</th>
                  <th>Bérlők</th><th>GDPR</th><th>Felel.</th><th>Aláírás</th>
                  <th>Státusz</th><th>Műveletek</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}
                    style={{ background: selected.has(b.id) ? 'rgba(255,255,255,0.04)' : '' }}>
                    <td>
                      <input type="checkbox" checked={selected.has(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        style={{ accentColor:'white', cursor:'pointer' }} />
                    </td>
                    <td style={{ color:'var(--c-grey2)', fontSize:'0.78rem' }}>#{b.id}</td>
                    <td style={{ fontSize:'0.78rem', whiteSpace:'nowrap' }}>{formatDateTime(b.created_at)}</td>
                    <td><strong style={{ color:'var(--c-white)' }}>{b.contact_name}</strong></td>
                    <td style={{ fontSize:'0.82rem' }}>{b.address_zip}</td>
                    <td style={{ fontSize:'0.82rem' }}>{b.address_city}</td>
                    <td style={{ fontSize:'0.82rem' }}>{b.address_street}</td>
                    <td style={{ fontSize:'0.82rem' }}>{b.address_house}</td>
                    <td style={{ fontSize:'0.82rem', whiteSpace:'nowrap' }}>{b.contact_phone}</td>
                    <td style={{ fontSize:'0.78rem' }}>{b.contact_email}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:'0.82rem' }}>{formatDate(b.pickup_date)}</td>
                    <td style={{ whiteSpace:'nowrap', fontSize:'0.82rem' }}>{formatDate(b.return_date)}</td>
                    <td style={{ textAlign:'center' }}>
                      <span style={{ background:'rgba(255,255,255,0.1)', padding:'2px 8px',
                        borderRadius:'99px', fontSize:'0.78rem' }}>{b.renter_count} fő</span>
                    </td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{b.gdpr_accepted ? '✅' : '❌'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{b.liability_accepted ? '✅' : '❌'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{b.signature_data ? '✍️' : '—'}</td>
                    <td><span className={`status-badge ${b.status}`}>{STATUS_LABELS[b.status]}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:'0.4rem' }}>
                        <Link to={`/admin/bookings/${b.id}`}
                          className="btn btn--ghost"
                          style={{ fontSize:'0.75rem', padding:'0.25rem 0.6rem' }}>
                          Részlet
                        </Link>
                        <button className="btn btn--ghost"
                          style={{ fontSize:'0.75rem', padding:'0.25rem 0.6rem' }}
                          onClick={() => handlePdfDownload(b)}
                          disabled={pdfLoading[b.id]}>
                          {pdfLoading[b.id] ? '⏳' : '📄 PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// Szűrő mezők komponens
function FilterFields({ search, setSearch, from, setFrom, to, setTo,
  statusFilter, setStatusFilter, onClear, isMobile }) {
  return (
    <div style={{
      display: isMobile ? 'flex' : 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap:'0.75rem', flexWrap:'wrap', alignItems: isMobile ? 'stretch' : 'flex-end'
    }}>
      <div className="form-group" style={{ margin:0, flex:'1 1 180px' }}>
        <label className="form-label">Keresés (név / email / tel)</label>
        <input className="form-input" type="text" placeholder="pl. Kovács Anna"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="form-group" style={{ margin:0 }}>
        <label className="form-label">Átvételtől</label>
        <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
      </div>
      <div className="form-group" style={{ margin:0 }}>
        <label className="form-label">Visszahozatalig</label>
        <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="form-group" style={{ margin:0 }}>
        <label className="form-label">Státusz</label>
        <div className="select-wrapper">
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Összes</option>
            {Object.entries({ new:'Új', confirmed:'Visszaigazolt',
              completed:'Teljesített', cancelled:'Törölt' }).map(([v,l]) =>
              <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <button className="btn btn--ghost" onClick={onClear}>Törlés</button>
    </div>
  );
}
