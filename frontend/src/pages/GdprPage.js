import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GdprPage() {
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
    // Ha a szöveg elfér görgetés nélkül
    setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 80) {
        setScrolled(true); setTimeout(() => setCanConfirm(true), 600);
      }
    }, 100);
    return () => el.removeEventListener('scroll', check);
  }, [scrolled]);

  const handleConfirm = () => {
    sessionStorage.setItem('gdpr_read', '1');
    navigate('/foglalas', { state: { step: 3 } });
  };

  const handleBack = () => {
    navigate('/foglalas', { state: { step: 3 } });
  };

  return (
    <div className="doc-reader">
      <div className="doc-reader__header">
        <button className="btn btn--ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          onClick={handleBack}>← Vissza</button>
        <h2>Adatkezelési tájékoztató</h2>
      </div>

      <div className="doc-reader__body" ref={bodyRef}>
        <div className="doc-reader__text">
          <p style={{ color:'var(--c-grey2)', fontSize:'0.8rem', marginBottom:'1.5rem' }}>
            Kérjük, görgesse végig a dokumentumot az elfogadáshoz.
          </p>

          <h3>Bevezetés</h3>
          <p>A <strong>Székely Szilárd E.V.</strong> (adószám: 67335495-1-33) és a <strong>Multiform Solution Kft.</strong> (cégjegyzékszám: 13-09-230517, adószám: 32413865-1-13) — a továbbiakban együttesen: Szolgáltató, adatkezelő — mint a keszisi.hu weboldal és az ahhoz kapcsolódó bérlési adatrögzítő rendszer üzemeltetői, aláveti magát a következő adatvédelmi szabályzatnak.</p>
          <p>Székhelye mindkét adatkezelőnek: <strong>2120 Dunakeszi, Katona József utca 23.</strong></p>
          <p>Elérhetőség: <strong>dunakeszisi@gmail.com</strong> | <strong>+36 30 459 5670</strong></p>
          <p>A természetes személyeknek a személyes adatok kezelése tekintetében történő védelméről és az ilyen adatok szabad áramlásáról szóló <strong>AZ EURÓPAI PARLAMENT ÉS A TANÁCS (EU) 2016/679 RENDELETE</strong> (GDPR) alapján az alábbi tájékoztatást adjuk.</p>

          <h3>1. Fogalom meghatározások</h3>
          <p><strong>„Személyes adat":</strong> azonosított vagy azonosítható természetes személyre vonatkozó bármely információ.</p>
          <p><strong>„Adatkezelés":</strong> a személyes adatokon végzett bármely művelet — gyűjtés, rögzítés, tárolás, felhasználás, törlés stb.</p>
          <p><strong>„Adatkezelő":</strong> az a személy vagy szervezet, amely a személyes adatok kezelésének céljait és eszközeit meghatározza.</p>
          <p><strong>„Az érintett hozzájárulása":</strong> az érintett önkéntes, konkrét és megfelelő tájékoztatáson alapuló egyértelmű beleegyezése.</p>

          <h3>2. A kezelt adatok köre és célja</h3>
          <ul>
            <li><strong>Kapcsolattartó neve</strong> — azonosítás, szerződéskötés, számlázás</li>
            <li><strong>Lakcím (számlázási cím)</strong> — szabályszerű számla kiállítása</li>
            <li><strong>Telefonszám</strong> — kapcsolattartás</li>
            <li><strong>E-mail cím</strong> — kapcsolattartás, visszaigazolás</li>
            <li><strong>Bérlők neve, életkora, magassága, testsúlya, lábmérete, sítudás szintje</strong> — a kölcsönzött felszerelés biztonságos beállításához (DIN érték, ISO 11088)</li>
            <li><strong>Bérlési időszak</strong> — a kölcsönzési szerződés teljesítéséhez</li>
          </ul>
          <p>Az adatkezelés jogalapja: <strong>GDPR 6. cikk (1) bekezdés b) pont</strong> — szerződés teljesítése, valamint az érintett hozzájárulása (a) pont.</p>

          <h3>3. Adatkezelés időtartama</h3>
          <p>A bérlési adatokat a Szolgáltató a polgári jogi elévülési idő (5 év) lejártáig őrzi. A számlázási adatokat a számviteli törvény alapján <strong>8 évig</strong> köteles megőrizni. A bérlők fizikai adatait a bérlési időszak lezárultát követő <strong>1 éven belül</strong> törli.</p>

          <h3>4. Adatmegismerésre jogosultak</h3>
          <p>A személyes adatokat kizárólag a Szolgáltató és feljogosított munkatársai kezelhetik. Harmadik félnek — jogszabályi kötelezettségen kívül — nem kerülnek átadásra. Tárhelyszolgáltató: <strong>Tárhelypark.hu</strong>.</p>

          <h3>5. Az érintett jogai</h3>
          <ul>
            <li><strong>Hozzáférési jog</strong> — tájékoztatást kérhet adatairól</li>
            <li><strong>Helyesbítési jog</strong> — kérheti a pontatlan adatok javítását</li>
            <li><strong>Törlési jog</strong> — kérheti adatai törlését, ha az adatkezelés célja megszűnt</li>
            <li><strong>Korlátozáshoz való jog</strong></li>
            <li><strong>Adathordozhatósághoz való jog</strong></li>
            <li><strong>Hozzájárulás visszavonásának joga</strong> — bármikor visszavonható</li>
          </ul>
          <p>Érvényesítés: <strong>dunakeszisi@gmail.com</strong> | +36 30 459 5670 | 2120 Dunakeszi, Katona József u. 23.</p>

          <h3>6. Jogorvoslat</h3>
          <p>Panasszal fordulhat a <strong>Nemzeti Adatvédelmi és Információszabadság Hatósághoz</strong> (NAIH): 1055 Budapest, Falk Miksa u. 9–11. | <a href="https://www.naih.hu" target="_blank" rel="noreferrer">www.naih.hu</a></p>

          <h3>7. Adatbiztonság</h3>
          <p>A Szolgáltató megfelelő technikai intézkedésekkel védi az adatokat jogosulatlan hozzáférés ellen. Az adatok titkosított (HTTPS) kapcsolaton keresztül kerülnek továbbításra.</p>

          <h3>8. Sütik</h3>
          <p>A rendszer kizárólag a működéshez szükséges munkamenet-sütiket alkalmaz. Marketing célú sütiket nem használ.</p>

          <h3>9. Módosítások</h3>
          <p>A Szolgáltató fenntartja a jogot jelen tájékoztató módosítására. A változások a keszisi.hu weboldalon való közzététellel lépnek hatályba.</p>

          <p style={{marginTop:'1.5rem',color:'var(--c-grey2)',fontSize:'0.8rem'}}>
            Dunakeszi, 2025. január 1. — Hatályos visszavonásig.
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
