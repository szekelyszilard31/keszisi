// PDF generátor - böngésző print API alapján
// Ez tökéletesen kezeli a magyar ékezetes karaktereket

const SKILL_LABELS = {
  elso_sielo: 'Első síelő', kezdo: 'Kezdő',
  kozephalado: 'Középhaladó', halado: 'Haladó', profi: 'Profi'
};

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${y}. ${m}. ${day}.`;
}

function sanitizeFileName(name) {
  return (name || 'ismeretlen')
    .replace(/á/g,'a').replace(/Á/g,'A')
    .replace(/é/g,'e').replace(/É/g,'E')
    .replace(/í/g,'i').replace(/Í/g,'I')
    .replace(/ó/g,'o').replace(/Ó/g,'O')
    .replace(/ö/g,'o').replace(/Ö/g,'O')
    .replace(/ő/g,'o').replace(/Ő/g,'O')
    .replace(/ú/g,'u').replace(/Ú/g,'U')
    .replace(/ü/g,'u').replace(/Ü/g,'U')
    .replace(/ű/g,'u').replace(/Ű/g,'U')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_');
}

export function getPdfFileName(booking) {
  const name = sanitizeFileName(booking.contact_name);
  const date = booking.pickup_date || 'datum';
  return `KESZISI_BERLOI_NYILATKOZAT_${name}_${date}.pdf`;
}

function buildPdfHTML(booking) {
  const address = [
    booking.address_zip, booking.address_city,
    booking.address_street, booking.address_house
  ].filter(Boolean).join(' ');

  const days = booking.pickup_date && booking.return_date
    ? Math.round((new Date(booking.return_date) - new Date(booking.pickup_date)) / 86400000)
    : 0;

  const rentersRows = (booking.renters || []).map((r, i) => `
    <tr class="${i % 2 === 0 ? 'even' : ''}">
      <td>${i + 1}.</td>
      <td><strong>${r.name}</strong></td>
      <td>${r.age} év</td>
      <td>${r.height_cm} cm</td>
      <td>${r.weight_kg} kg</td>
      <td>EU ${r.shoe_size}</td>
      <td>${SKILL_LABELS[r.skill_level] || r.skill_level}</td>
      <td><span class="din-badge">${Number(r.din_value).toFixed(2)}</span></td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>KESZISI_BERLOI_NYILATKOZAT</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #1e293b;
    background: white;
    padding: 0;
  }

  /* Fejléc */
  .header {
    background: #0f0f17;
    color: white;
    padding: 20px 30px 16px;
    text-align: center;
  }
  .header .logo-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.12em;
    margin-bottom: 3px;
  }
  .header .subtitle {
    font-size: 10px;
    color: #a0a0b8;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
  .header .doc-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #ffffff;
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 10px;
  }

  /* Tartalom */
  .content { padding: 16px 30px; }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: #94a3b8;
    margin-bottom: 12px;
  }

  .divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 10px 0;
  }

  /* Szekciók */
  .section { margin-bottom: 14px; }

  .section-label {
    font-size: 8px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
  }

  /* Bérlési időszak */
  .dates-box {
    display: flex;
    gap: 30px;
    align-items: center;
  }
  .date-item .label { font-size: 9px; color: #94a3b8; margin-bottom: 2px; }
  .date-item .value { font-size: 14px; font-weight: 700; color: #0f172a; }
  .days-badge {
    margin-left: auto;
    font-size: 11px;
    color: #64748b;
  }

  /* Kapcsolattartó */
  .contact-grid {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 3px 8px;
  }
  .contact-grid .lbl { color: #94a3b8; font-size: 9px; }
  .contact-grid .val { color: #0f172a; font-size: 10px; font-weight: 500; }

  /* Táblázat */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  thead tr {
    background: #0f0f17;
    color: #a0a0b8;
  }
  th {
    padding: 6px 8px;
    text-align: left;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
  tr.even td { background: #f8fafc; }

  .din-badge {
    background: #0f0f17;
    color: white;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 700;
    display: inline-block;
  }

  /* Nyilatkozatok */
  .nyilatkozat-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 10px 14px;
  }
  .nyilatkozat-box .item {
    color: #15803d;
    font-size: 10px;
    margin-bottom: 4px;
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .nyilatkozat-box .item:last-child { margin-bottom: 0; }

  /* Fontos doboz */
  .warn-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 9px;
    color: #92400e;
    line-height: 1.5;
  }

  /* Aláírás */
  .signature-section { margin-bottom: 14px; }
  .signature-box {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    height: 100px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .signature-box img {
    max-height: 96px;
    max-width: 100%;
    object-fit: contain;
  }
  .signature-line {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 9px;
    color: #64748b;
  }
  .signature-name { border-top: 1px solid #1e293b; padding-top: 3px; min-width: 200px; }

  /* Lábléc */
  .footer {
    border-top: 1px solid #e2e8f0;
    padding: 10px 30px;
    text-align: center;
    font-size: 8.5px;
    color: #94a3b8;
    line-height: 1.7;
  }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead tr { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .din-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .nyilatkozat-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .warn-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo-title">KESZISI.HU</div>
  <div class="subtitle">Sí &amp; Kerékpár Szerviz &nbsp;·&nbsp; Dunakeszi</div>
  <div class="doc-title">BÉRLŐI NYILATKOZAT</div>
</div>

<div class="content">

  <div class="meta-row">
    <span>Azonosító: <strong>#${booking.id}</strong></span>
    <span>Nyomtatva: ${new Date().toLocaleDateString('hu-HU')}</span>
  </div>
  <hr class="divider">

  <!-- Bérlési időszak -->
  <div class="section">
    <div class="section-label">Bérlési időszak</div>
    <div class="box">
      <div class="dates-box">
        <div class="date-item">
          <div class="label">Felszerelés átvétele</div>
          <div class="value">${formatDate(booking.pickup_date)}</div>
        </div>
        <div style="color:#94a3b8;font-size:16px;">→</div>
        <div class="date-item">
          <div class="label">Felszerelés visszahozatala</div>
          <div class="value">${formatDate(booking.return_date)}</div>
        </div>
        <div class="days-badge">${days} nap</div>
      </div>
    </div>
  </div>

  <!-- Kapcsolattartó -->
  <div class="section">
    <div class="section-label">Kapcsolattartó / Számlázási adatok</div>
    <div class="box">
      <div class="contact-grid">
        <span class="lbl">Neve:</span>
        <span class="val">${booking.contact_name || ''}</span>
        <span class="lbl">Cím:</span>
        <span class="val">${address}</span>
        <span class="lbl">Telefon:</span>
        <span class="val">${booking.contact_phone || ''}</span>
        <span class="lbl">E-mail:</span>
        <span class="val">${booking.contact_email || ''}</span>
      </div>
    </div>
  </div>

  <!-- Bérlők -->
  <div class="section">
    <div class="section-label">Beállítási adatok és DIN értékek</div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Név</th><th>Kor</th><th>Magasság</th>
          <th>Súly</th><th>Lábméret</th><th>Sítudás</th><th>DIN</th>
        </tr>
      </thead>
      <tbody>${rentersRows}</tbody>
    </table>
  </div>

  <!-- Nyilatkozatok -->
  <div class="section">
    <div class="section-label">Megismert és elfogadott nyilatkozatok</div>
    <div class="nyilatkozat-box">
      <div class="item">
        <span>✓</span>
        <span><strong>Adatkezelési tájékoztató</strong> — megismertem, elolvastam és elfogadtam</span>
      </div>
      <div class="item">
        <span>✓</span>
        <span><strong>Felelősségi nyilatkozat</strong> — megismertem, elolvastam és tudomásul vettem</span>
      </div>
    </div>
  </div>

  <!-- Fontos -->
  <div class="section">
    <div class="warn-box">
      <strong>Fontos:</strong> A DIN értékek ISO 11088 szabvány alapján kerültek kiszámításra,
      biztonsági célból csökkentve (2,01–4,00 közötti értéknél −0,5; 4,01 felett −1,0;
      2,00 alatti értéknél nincs levonás). A tényleges kötésbeállítást szakemberünk
      végzi el az üzletben, a felszerelés átvételekor.
    </div>
  </div>

  <!-- Aláírás -->
  <div class="signature-section">
    <div class="section-label">Ügyfél aláírása</div>
    <div class="signature-box">
      ${booking.signature_data
        ? `<img src="${booking.signature_data}" alt="Aláírás" />`
        : `<span style="color:#94a3b8;font-size:10px;">(Aláírás nem áll rendelkezésre)</span>`
      }
    </div>
    <div class="signature-line">
      <div class="signature-name">${booking.contact_name || ''}</div>
      <div>Dátum: ${formatDate(booking.pickup_date)}</div>
    </div>
  </div>

</div>

<div class="footer">
  <strong style="color:#334155;">Keszisi Sí &amp; Kerékpár Szerviz</strong><br>
  2120 Dunakeszi, Katona József utca 23.<br>
  +36 30 459 5670 &nbsp;·&nbsp; dunakeszisi@gmail.com &nbsp;·&nbsp; www.keszisi.hu
</div>

</body>
</html>`;
}

export async function downloadBookingPDF(booking) {
  const fileName = getPdfFileName(booking);
  const html = buildPdfHTML(booking);

  // Nyomtatási ablak megnyitása
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(html);
  printWindow.document.close();

  // Megvárjuk a betöltést, majd nyomtatási dialógus
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.document.title = fileName;
      printWindow.print();
      // Nyomtatás után bezárjuk
      printWindow.onafterprint = () => printWindow.close();
    }, 500);
  };
}

export async function downloadMultiplePDFs(bookings) {
  for (const booking of bookings) {
    await downloadBookingPDF(booking);
    await new Promise(r => setTimeout(r, 1000));
  }
}
