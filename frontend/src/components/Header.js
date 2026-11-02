import React from 'react';

export default function Header() {
  return (
    <header className="site-header">
      <img
        src="/logo.webp"
        alt="Keszisi.hu logó"
        style={{
          height: '52px',
          width: 'auto',
          display: 'block',
          filter: 'brightness(0) invert(1)',
        }}
      />
      <div style={{ marginLeft: '0.75rem' }}>
        <div className="site-header__logo">
          KESZISI<span style={{ color: 'var(--c-grey2)' }}>.</span>HU
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--c-grey2)', marginTop: '1px' }}>
          Sí &amp; Kerékpár Szerviz · Dunakeszi
        </div>
      </div>
      <span className="site-header__sub">Felszerelés előjegyzés</span>
    </header>
  );
}
