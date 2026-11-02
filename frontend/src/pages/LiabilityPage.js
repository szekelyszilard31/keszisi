import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LiabilityPage() {
  const [canConfirm, setCanConfirm] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const bodyRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
        if (!scrolled) { setScrolled(true); setTimeout(() => setCanConfirm(true), 600); }
      }
    };
    el.addEventListener('scroll', check);
    setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 80) {
        setScrolled(true); setTimeout(() => setCanConfirm(true), 600);
      }
    }, 100);
    return () => el.removeEventListener('scroll', check);
  }, [scrolled]);

  const handleConfirm = () => {
    sessionStorage.setItem('liability_read', '1');
    navigate('/foglalas', { state: { step: 3 } });
  };

  const handleBack = () => {
    navigate('/foglalas', { state: { step: 3 } });
  };

  return (
    <div className="doc-reader">
      <div className="doc-reader__header">
        <button className="btn btn--ghost" style={{padding:'0.4rem 0.8rem',fontSize:'0.82rem'}}
          onClick={handleBack}>← Vissza</button>
        <h2>Felelősségi nyilatkozat</h2>
      </div>

      <div className="doc-reader__body" ref={bodyRef}>
        <div className="doc-reader__text">
          <p style={{color:'var(--c-grey2)',fontSize:'0.8rem',marginBottom:'1.5rem'}}>
            Kérjük, görgesse végig a dokumentumot az elfogadáshoz.
          </p>

          <div style={{background:'rgba(240,192,96,0.08)',border:'1px solid rgba(240,192,96,0.3)',
            borderRadius:'8px',padding:'1rem',marginBottom:'1.5rem',color:'var(--c-warn)',fontSize:'0.82rem'}}>
            ⚠️ <strong>Megjegyzés:</strong> A végleges jogi szöveg hamarosan feltöltésre kerül.
            Az alábbi szöveg tájékoztató jellegű.
          </div>

          <h3>Felelősségi nyilatkozat — Sífelszerelés kölcsönzés</h3>
          <p><strong>Szolgáltató:</strong> Székely Szilárd E.V. és Multiform Solution Kft.<br/>
          <strong>Székhely:</strong> 2120 Dunakeszi, Katona József utca 23.<br/>
          <strong>Elérhetőség:</strong> dunakeszisi@gmail.com | +36 30 459 5670</p>

          <h3>1. A kölcsönzött eszközök állapota</h3>
          <p>A bérlő tudomásul veszi, hogy a Keszisi Sí- és Kerékpár Szerviz által kölcsönzött sí-, snowboard- és egyéb téli sportfelszerelések <strong>használt eszközök</strong>, amelyek állapota nem azonos az új, gyári felszerelésekkel.</p>
          <p>A Szolgáltató minden kölcsönzési szezon előtt elvégzi a szükséges karbantartásokat és biztonsági ellenőrzéseket. A bérlő a felszerelés átvételével elismeri, hogy azt megvizsgálta és állapotával tisztában van.</p>

          <h3>2. DIN kötésbeállítás</h3>
          <p>A sílécek kötésének beállítása az ügyfél által megadott adatok alapján, az ISO 11088 szabvány szerint történik. Biztonsági célból a számított értékből <strong>1 egész értéket vonunk le</strong>. A bérlő tudomásul veszi, hogy a valótlan adatok megadásából eredő következmények őt terhelik.</p>

          <h3>3. Felelősség kizárása</h3>
          <p>A bérlő tudomásul veszi és elfogadja, hogy a kölcsönzött felszerelések használata során bekövetkező <strong>balesetekért, sérülésekért, anyagi károkért</strong> — amennyiben azok a természetes elhasználódással, nem rendeltetésszerű használattal, vagy valótlan adatok megadásával összefüggnek — a <strong>Szolgáltató felelősséget nem vállal</strong>.</p>
          <p>A bérlő elismeri, hogy a síelés és snowboardozás <strong>kockázatos sporttevékenység</strong>, amelynek veszélyeit ismeri és tudatosan vállalja.</p>

          <h3>4. A bérlő kötelezettségei</h3>
          <ul>
            <li>A felszerelést rendeltetésszerűen és gondosan kell használni</li>
            <li>A felszerelést a megállapodott időpontban kell visszahozni</li>
            <li>Megrongálódás esetén a bérlő a keletkezett kárt köteles megtéríteni</li>
            <li>Kiskorú bérlő esetén a törvényes képviselő vállalja a felelősséget</li>
          </ul>

          <h3>5. Alkalmazandó jog</h3>
          <p>Jelen nyilatkozatra a magyar jog az irányadó. Vitás kérdésekben a felek békés megoldásra törekednek. Ennek hiányában a Dunakeszi székhelyű Szolgáltató szerint illetékes bíróság jár el.</p>

          <p style={{marginTop:'1.5rem',color:'var(--c-grey2)',fontSize:'0.8rem'}}>
            Dunakeszi, 2025. január 1. — A végleges dokumentum hamarosan frissítésre kerül.
          </p>
        </div>
      </div>

      <div className="doc-reader__footer">
        {!scrolled && <div className="scroll-hint">⬇ Görgessen le a dokumentum végéig az elfogadáshoz</div>}
        {scrolled && !canConfirm && <div className="scroll-hint">Hamarosan aktív lesz az elfogadás...</div>}
        {canConfirm && (
          <button className="btn btn--primary" style={{minWidth:240}} onClick={handleConfirm}>
            ✓ Elolvastam, visszalépek a kitöltéshez
          </button>
        )}
      </div>
    </div>
  );
}
