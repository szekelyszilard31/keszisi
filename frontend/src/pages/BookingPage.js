import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import RenterForm from '../components/RenterForm';
import SignaturePad from '../components/SignaturePad';
import API from '../utils/api';

const EMPTY_RENTER = {
  name: '', age: '', height_cm: '', weight_kg: '',
  shoe_size: '', skill_level: '', din_value: null
};

const STEPS = ['Dátumok', 'Személyes adatok', 'Bérlők', 'Nyilatkozatok', 'Aláírás'];

// Adatok mentése sessionStorage-ba
function saveFormData(data) {
  sessionStorage.setItem('booking_form', JSON.stringify(data));
}

// Adatok visszatöltése sessionStorage-ból
function loadFormData() {
  try {
    const saved = sessionStorage.getItem('booking_form');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Adatok inicializálása - sessionStorage-ból töltjük vissza ha van
  const saved = loadFormData();

  const [step, setStep]           = useState(saved?.step ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [pickupDate, setPickupDate]   = useState(saved?.pickupDate ?? '');
  const [returnDate, setReturnDate]   = useState(saved?.returnDate ?? '');
  const [contactName, setContactName] = useState(saved?.contactName ?? '');
  const [addrZip, setAddrZip]         = useState(saved?.addrZip ?? '');
  const [addrCity, setAddrCity]       = useState(saved?.addrCity ?? '');
  const [addrStreet, setAddrStreet]   = useState(saved?.addrStreet ?? '');
  const [addrHouse, setAddrHouse]     = useState(saved?.addrHouse ?? '');
  const [phone, setPhone]             = useState(saved?.phone ?? '');
  const [email, setEmail]             = useState(saved?.email ?? '');
  const [gdpr, setGdpr]               = useState(saved?.gdpr ?? false);
  const [liability, setLiability]     = useState(saved?.liability ?? false);
  const [renters, setRenters]         = useState(saved?.renters ?? [{ ...EMPTY_RENTER }]);
  const [signatureData, setSignatureData] = useState(saved?.signatureData ?? null);
  const [gdprRead, setGdprRead]       = useState(sessionStorage.getItem('gdpr_read') === '1');
  const [liabilityRead, setLiabilityRead] = useState(sessionStorage.getItem('liability_read') === '1');

  // Ha a doc oldalról jövünk vissza: ugorjunk a 4. lépésre
  useEffect(() => {
    if (location.state?.step === 3) {
      setStep(3);
      setGdprRead(sessionStorage.getItem('gdpr_read') === '1');
      setLiabilityRead(sessionStorage.getItem('liability_read') === '1');
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line

  // Minden változáskor mentjük az adatokat sessionStorage-ba
  useEffect(() => {
    saveFormData({ step, pickupDate, returnDate, contactName, addrZip, addrCity, addrStreet, addrHouse, phone, email, gdpr, liability, renters, signatureData });
  }, [step, pickupDate, returnDate, contactName, addrZip, addrCity, addrStreet, addrHouse, phone, email, gdpr, liability, renters, signatureData]);

  // Olvasottság frissítése
  useEffect(() => {
    setGdprRead(sessionStorage.getItem('gdpr_read') === '1');
    setLiabilityRead(sessionStorage.getItem('liability_read') === '1');
  }, [step]);

  const updateRenter = (i, data) => {
    const updated = [...renters];
    updated[i] = data;
    setRenters(updated);
  };

  const addRenter = () => {
    if (renters.length < 10) setRenters([...renters, { ...EMPTY_RENTER }]);
  };

  const removeRenter = (i) => setRenters(renters.filter((_, idx) => idx !== i));

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!pickupDate) errs.pickupDate = 'Kötelező megadni.';
      if (!returnDate) errs.returnDate = 'Kötelező megadni.';
      if (pickupDate && returnDate && returnDate <= pickupDate)
        errs.returnDate = 'A visszahozatal napjának az elvitel utánra kell esnie.';
    }
    if (step === 1) {
      if (!contactName.trim()) errs.contactName = 'Kötelező megadni.';
      if (!addrZip.trim())    errs.addrZip    = 'Kötelező megadni.';
      if (!addrCity.trim())   errs.addrCity   = 'Kötelező megadni.';
      if (!addrStreet.trim()) errs.addrStreet = 'Kötelező megadni.';
      if (!addrHouse.trim())  errs.addrHouse  = 'Kötelező megadni.';
      if (!phone.trim())       errs.phone       = 'Kötelező megadni.';
      if (!email.trim())       errs.email       = 'Kötelező megadni.';
      else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Érvénytelen email cím.';
    }
    if (step === 2) {
      renters.forEach((r, i) => {
        if (!r.name.trim())  errs[`r${i}_name`]        = 'Kötelező.';
        if (!r.age)          errs[`r${i}_age`]         = 'Kötelező.';
        if (!r.height_cm)    errs[`r${i}_height_cm`]   = 'Kötelező.';
        if (!r.weight_kg)    errs[`r${i}_weight_kg`]   = 'Kötelező.';
        if (!r.shoe_size)    errs[`r${i}_shoe_size`]   = 'Kötelező.';
        if (!r.skill_level)  errs[`r${i}_skill_level`] = 'Kötelező.';
      });
    }
    if (step === 3) {
      if (!gdprRead)      errs.gdpr_read      = 'Kérjük olvassa el az adatkezelési tájékoztatót.';
      if (!gdpr)          errs.gdpr           = 'Az elfogadás kötelező.';
      if (!liabilityRead) errs.liability_read = 'Kérjük olvassa el a felelősségi nyilatkozatot.';
      if (!liability)     errs.liability      = 'Az elfogadás kötelező.';
    }
    if (step === 4) {
      if (!signatureData) errs.signature = 'Az aláírás kötelező.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => { setFieldErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError('');
    try {
      await API.post('/bookings', {
        pickup_date: pickupDate, return_date: returnDate,
        contact_name: contactName,
        address_zip: addrZip, address_city: addrCity,
        address_street: addrStreet, address_house: addrHouse,
        contact_phone: phone, contact_email: email,
        gdpr_accepted: gdpr, liability_accepted: liability,
        signature_data: signatureData,
        renters: renters.map(r => ({
          name: r.name, age: Number(r.age),
          height_cm: Number(r.height_cm), weight_kg: Number(r.weight_kg),
          shoe_size: Number(r.shoe_size), skill_level: r.skill_level,
        }))
      });
      // Sikeres beküldés: töröljük a mentett adatokat
      sessionStorage.removeItem('booking_form');
      sessionStorage.removeItem('gdpr_read');
      sessionStorage.removeItem('liability_read');
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Hiba történt. Kérjük próbálja újra.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    sessionStorage.removeItem('booking_form');
    sessionStorage.removeItem('gdpr_read');
    sessionStorage.removeItem('liability_read');
    setSubmitted(false); setStep(0); setError(''); setFieldErrors({});
    setPickupDate(''); setReturnDate('');
    setContactName(''); setAddrZip(''); setAddrCity(''); setAddrStreet(''); setAddrHouse(''); setPhone(''); setEmail('');
    setGdpr(false); setLiability(false); setGdprRead(false); setLiabilityRead(false); setSignatureData(null);
    setRenters([{ ...EMPTY_RENTER }]);
  };

  if (submitted) {
    return (
      <>
        <Header />
        <div className="success-page">
          <div className="success-icon">✅</div>
          <h1>Adatok rögzítve!</h1>
          <p style={{ marginTop: '0.75rem', maxWidth: 440 }}>
            Köszönjük, adatait sikeresen rögzítettük. Kérjük, szóljon az eladónak,
            hogy megvan az előzetes kitöltés — ő folytatja a foglalást.
          </p>
          <button className="btn btn--secondary" style={{ marginTop: '2rem' }} onClick={resetForm}>
            + Új kitöltés
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ padding: '1.5rem 0 3rem' }}>
        <div className="container">

          <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
            {STEPS.map((_, i) => (
              <div key={i} className={`progress-step ${i < step ? 'done' : i === step ? 'active' : ''}`} />
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--c-grey2)', marginBottom: '1.5rem' }}>
            {step + 1}. lépés / {STEPS.length} —{' '}
            <strong style={{ color: 'var(--c-grey)' }}>{STEPS[step]}</strong>
          </p>

          {/* ── 1. LÉPÉS: Dátumok ── */}
          {step === 0 && (
            <div className="card">
              <div className="card__title">
                <span className="step-badge">1</span>
                <h2>Bérlési időszak</h2>
              </div>
              <div className="alert alert--info" style={{ fontSize: '0.82rem' }}>
                Kérjük a <strong>tényleges átvétel és visszahozatal napját</strong> adja meg —
                nem azt, amikor síelni fog.
              </div>
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Felszerelés átvételének napja <span className="required">*</span></label>
                  <input className={`form-input ${fieldErrors.pickupDate ? 'error' : ''}`}
                    type="date" min={today} value={pickupDate}
                    onChange={e => { setPickupDate(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.pickupDate && <p className="form-error">{fieldErrors.pickupDate}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Felszerelés visszahozatalának napja <span className="required">*</span></label>
                  <input className={`form-input ${fieldErrors.returnDate ? 'error' : ''}`}
                    type="date" min={pickupDate || today} value={returnDate}
                    onChange={e => { setReturnDate(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.returnDate && <p className="form-error">{fieldErrors.returnDate}</p>}
                </div>
              </div>
              {pickupDate && returnDate && returnDate > pickupDate && (
                <p className="form-hint">
                  Bérlési időszak: <strong style={{ color: 'var(--c-white)' }}>
                    {Math.round((new Date(returnDate) - new Date(pickupDate)) / 86400000)} nap
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* ── 2. LÉPÉS: Kapcsolattartó ── */}
          {step === 1 && (
            <div className="card">
              <div className="card__title">
                <span className="step-badge">2</span>
                <h2>Kapcsolattartó és számlázási adatok</h2>
              </div>
              <div className="form-group">
                <label className="form-label">Teljes neve <span className="required">*</span></label>
                <input className={`form-input ${fieldErrors.contactName ? 'error' : ''}`}
                  type="text" placeholder="Vezetéknév Keresztnév" value={contactName}
                  onChange={e => { setContactName(e.target.value); setFieldErrors({}); }} />
                {fieldErrors.contactName && <p className="form-error">{fieldErrors.contactName}</p>}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Lakcím (számlázási cím) <span className="required">*</span>
                </label>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '120px 1fr', marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--c-grey2)' }}>Irányítószám</label>
                  <input className={`form-input ${fieldErrors.addrZip ? 'error' : ''}`}
                    type="text" placeholder="2120" maxLength="4" value={addrZip}
                    onChange={e => { setAddrZip(e.target.value.replace(/\D/g,'')); setFieldErrors({}); }} />
                  {fieldErrors.addrZip && <p className="form-error">{fieldErrors.addrZip}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--c-grey2)' }}>Város</label>
                  <input className={`form-input ${fieldErrors.addrCity ? 'error' : ''}`}
                    type="text" placeholder="Dunakeszi" value={addrCity}
                    onChange={e => { setAddrCity(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.addrCity && <p className="form-error">{fieldErrors.addrCity}</p>}
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 100px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--c-grey2)' }}>Utca, közterület neve</label>
                  <input className={`form-input ${fieldErrors.addrStreet ? 'error' : ''}`}
                    type="text" placeholder="Katona József utca" value={addrStreet}
                    onChange={e => { setAddrStreet(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.addrStreet && <p className="form-error">{fieldErrors.addrStreet}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--c-grey2)' }}>Házszám</label>
                  <input className={`form-input ${fieldErrors.addrHouse ? 'error' : ''}`}
                    type="text" placeholder="23." value={addrHouse}
                    onChange={e => { setAddrHouse(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.addrHouse && <p className="form-error">{fieldErrors.addrHouse}</p>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telefonszám <span className="required">*</span></label>
                  <input className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
                    type="tel" placeholder="+36 30 000 0000" value={phone}
                    onChange={e => { setPhone(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.phone && <p className="form-error">{fieldErrors.phone}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email cím <span className="required">*</span></label>
                  <input className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                    type="email" placeholder="pelda@email.hu" value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors({}); }} />
                  {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. LÉPÉS: Bérlők ── */}
          {step === 2 && (
            <div className="card">
              <div className="card__title">
                <span className="step-badge">3</span>
                <h2>Bérlők adatai</h2>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Adja meg minden bérlő adatait. A DIN kötésbeállítási értéket
                az ISO 11088 szabvány alapján automatikusan kiszámítjuk.
              </p>
              {renters.map((r, i) => (
                <RenterForm key={i} index={i} data={r}
                  onChange={data => updateRenter(i, data)}
                  onRemove={() => removeRenter(i)}
                  canRemove={renters.length > 1} />
              ))}
              {renters.length < 10 && (
                <button type="button" className="btn btn--secondary btn--full"
                  onClick={addRenter} style={{ marginTop: '0.5rem' }}>
                  + Újabb bérlő hozzáadása
                </button>
              )}
              {Object.keys(fieldErrors).length > 0 && (
                <div className="alert alert--error" style={{ marginTop: '1rem' }}>
                  Kérjük töltse ki az összes kötelező mezőt minden bérlőnél.
                </div>
              )}
            </div>
          )}

          {/* ── 4. LÉPÉS: Nyilatkozatok ── */}
          {step === 3 && (
            <div className="card">
              <div className="card__title">
                <span className="step-badge">4</span>
                <h2>Nyilatkozatok és elfogadás</h2>
              </div>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Az alábbi dokumentumokat el kell olvasnia a folytatáshoz.
                Kattintson a gombra, olvassa végig, majd térjen vissza.
              </p>

              {/* GDPR */}
              <div style={{ marginBottom: '1.25rem' }}>
                <button className={`read-required-btn ${gdprRead ? 'done' : ''}`}
                  onClick={() => navigate('/gdpr')}>
                  {gdprRead ? '✓ Adatkezelési tájékoztató elolvasva' : '📄 Adatkezelési tájékoztató elolvasása →'}
                </button>
                {fieldErrors.gdpr_read && <p className="form-error">{fieldErrors.gdpr_read}</p>}
                <label className={`checkbox-group ${!gdprRead ? 'locked' : ''}`}
                  onClick={() => { if (gdprRead) { setGdpr(!gdpr); setFieldErrors({}); } }}>
                  <input type="checkbox" checked={gdpr} onChange={() => {}} disabled={!gdprRead} />
                  <span className="label-text">
                    Elolvastam és elfogadom az <strong>Adatkezelési tájékoztatót</strong>.
                    Hozzájárulok személyes adataim és a bérlők adatainak kezeléséhez
                    a kölcsönzési szerződés teljesítése céljából.
                    {!gdprRead && <span style={{ color: 'var(--c-warn)', marginLeft: 4 }}>— először olvassa el!</span>}
                  </span>
                </label>
                {fieldErrors.gdpr && <p className="form-error">{fieldErrors.gdpr}</p>}
              </div>

              {/* Felelősségi nyilatkozat */}
              <div style={{ marginBottom: '1rem' }}>
                <button className={`read-required-btn ${liabilityRead ? 'done' : ''}`}
                  onClick={() => navigate('/liability')}>
                  {liabilityRead ? '✓ Felelősségi nyilatkozat elolvasva' : '📄 Felelősségi nyilatkozat elolvasása →'}
                </button>
                {fieldErrors.liability_read && <p className="form-error">{fieldErrors.liability_read}</p>}
                <label className={`checkbox-group ${!liabilityRead ? 'locked' : ''}`}
                  onClick={() => { if (liabilityRead) { setLiability(!liability); setFieldErrors({}); } }}>
                  <input type="checkbox" checked={liability} onChange={() => {}} disabled={!liabilityRead} />
                  <span className="label-text">
                    Tudomásul veszem és elfogadom a <strong>Felelősségi nyilatkozatban</strong> foglaltakat.
                    Tudomásul veszem, hogy a kölcsönzött eszközök használt felszerelések.
                    {!liabilityRead && <span style={{ color: 'var(--c-warn)', marginLeft: 4 }}>— először olvassa el!</span>}
                  </span>
                </label>
                {fieldErrors.liability && <p className="form-error">{fieldErrors.liability}</p>}
              </div>

              {error && <div className="alert alert--error">{error}</div>}
            </div>
          )}

          {/* ── 5. LÉPÉS: Aláírás ── */}
          {step === 4 && (
            <div className="card">
              <div className="card__title">
                <span className="step-badge">5</span>
                <h2>Aláírás</h2>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Az adatok és nyilatkozatok megerősítéseként kérjük írja alá az alábbi mezőben.
                Az aláírás bekerül a rögzített dokumentumba.
              </p>

              <div style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Aláírás <span className="required">*</span></label>
              </div>
              <SignaturePad onChange={setSignatureData} />
              {fieldErrors.signature && (
                <p className="form-error" style={{ marginTop: '0.5rem' }}>{fieldErrors.signature}</p>
              )}

              {/* Összefoglaló */}
              <div style={{ marginTop: '1.5rem', padding: '1rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--c-border)',
                borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--c-grey2)' }}>
                <div style={{ marginBottom: '0.4rem', color: 'var(--c-grey)', fontWeight: 600 }}>
                  Összefoglalás:
                </div>
                <div>📅 {pickupDate} → {returnDate}</div>
                <div>👤 {contactName}</div>
                <div>🎿 {renters.length} bérlő</div>
                <div style={{ marginTop: '0.4rem' }}>
                  ✓ Adatkezelési tájékoztató elfogadva<br/>
                  ✓ Felelősségi nyilatkozat elfogadva
                </div>
              </div>

              {error && <div className="alert alert--error" style={{ marginTop: '1rem' }}>{error}</div>}
            </div>
          )}

          {/* Navigáció */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            {step > 0
              ? <button className="btn btn--ghost" onClick={prevStep}>← Vissza</button>
              : <div />
            }
            {step < STEPS.length - 1
              ? <button className="btn btn--primary" onClick={nextStep}>Következő →</button>
              : <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting || !signatureData}>
                  {submitting ? <><span className="spinner" /> Küldés...</> : '✓ Adatok rögzítése'}
                </button>
            }
          </div>

        </div>
      </main>
    </>
  );
}
