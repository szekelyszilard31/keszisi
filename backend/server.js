require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const { initDB, dbGet, dbAll, dbRun } = require('./db');
const { calculateDIN } = require('./din');
const { sendConfirmationEmail, sendTestEmail } = require('./mailer');

const app = express();
const db = initDB();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ Hiányzik a JWT_SECRET környezeti változó. Állítsd be a .env fájlban (dev) vagy a hosting felületén (production).');
  process.exit(1);
}
const PORT = process.env.PORT || 3001;
const SUPERADMIN_EMAIL = 'szekelyszilard31@gmail.com';

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

app.set('trust proxy', 1);
// Production = egybeépített app (frontend build-et is ez a szerver szolgálja ki,
// tehát same-origin). CORS csak a helyi fejlesztéshez kell (CRA dev proxy mögött
// amúgy is same-origin a böngészőből, de LAN-os eszközről közvetlen backend-eléréshez
// hasznos lazán engedni).
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

const bookingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `${req.params.docType}.pdf`)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Csak PDF fájl tölthető fel.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ── Auth middleware ──
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Nincs jogosultság.' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Érvénytelen token.' });
  }
}

function superAdminOnly(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Ez a művelet csak szuper admin jogosultsággal végezhető.' });
  }
  next();
}

// ── Setup státusz ──
app.get('/api/setup-status', async (req, res) => {
  const admin = await dbGet(db, "SELECT id FROM admin_users WHERE status = 'approved' LIMIT 1");
  res.json({ needsSetup: !admin });
});

// ── Első admin létrehozása (csak ha még nincs senki) ──
app.post('/api/setup', async (req, res) => {
  const existing = await dbGet(db, "SELECT id FROM admin_users LIMIT 1");
  if (existing) return res.status(400).json({ error: 'Az admin már be van állítva.' });
  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Felhasználónév, email és legalább 6 karakteres jelszó szükséges.' });
  const hash = await bcrypt.hash(password, 10);
  // Az első felhasználó admin státuszú de még nem superadmin - azt kézzel állítjuk
  await dbRun(db,
    "INSERT INTO admin_users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'approved')",
    [username, email, hash]
  );
  res.json({ ok: true });
});

// ── Regisztráció (jóváhagyásra vár) ──
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Hiányzó vagy érvénytelen adatok.' });

  const existing = await dbGet(db, 'SELECT id FROM admin_users WHERE username = ? OR email = ?', [username, email]);
  if (existing) return res.status(400).json({ error: 'Ez a felhasználónév vagy email már foglalt.' });

  const hash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString('hex');

  await dbRun(db,
    "INSERT INTO admin_users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'pending')",
    [username, email, hash]
  );

  const newUser = await dbGet(db, 'SELECT id FROM admin_users WHERE email = ?', [email]);

  // Jóváhagyó email küldése a superadminnak
  try {
    const { sendRegistrationApprovalEmail } = require('./mailer');
    await sendRegistrationApprovalEmail({
      newUsername: username,
      newEmail: email,
      userId: newUser.id,
      approvalToken: token,
    });
    // Token mentése az adatbázisba
    await dbRun(db, 'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [hash + '::token::' + token, newUser.id]);
  } catch(e) {
    console.error('Jóváhagyó email hiba:', e.message);
  }

  res.json({ ok: true, message: 'Regisztrációd megérkezett. A szuper admin jóváhagyása szükséges a belépéshez.' });
});

// ── Regisztráció jóváhagyása (email linkből) ──
app.get('/api/approve/:userId/:token', async (req, res) => {
  const { userId, token } = req.params;
  const user = await dbGet(db, 'SELECT * FROM admin_users WHERE id = ?', [userId]);

  if (!user) return res.status(404).send('<h2>Nem található felhasználó.</h2>');
  if (user.status === 'approved') return res.send('<h2>Ez a fiók már jóváhagyva van.</h2>');

  // Token ellenőrzés
  const storedToken = user.password_hash.split('::token::')[1];
  if (storedToken !== token) return res.status(400).send('<h2>Érvénytelen jóváhagyási link.</h2>');

  // Jelszóhash visszaállítása (token nélkül)
  const cleanHash = user.password_hash.split('::token::')[0];
  await dbRun(db, "UPDATE admin_users SET status = 'approved', password_hash = ? WHERE id = ?", [cleanHash, userId]);

  res.send(`
    <!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8">
    <title>Jóváhagyva</title>
    <style>body{font-family:Arial,sans-serif;background:#0f0f17;color:white;display:flex;
    align-items:center;justify-content:center;min-height:100vh;text-align:center;}
    .box{background:#1c1c28;border:1px solid #2e2e42;border-radius:12px;padding:40px;max-width:400px;}
    h2{margin-bottom:12px;} p{color:#a0a0b8;font-size:14px;}</style></head>
    <body><div class="box">
      <div style="font-size:2rem;margin-bottom:16px;">✅</div>
      <h2>Fiók jóváhagyva!</h2>
      <p><strong>${user.username}</strong> fiókja sikeresen jóváhagyva. Az illető mostantól be tud lépni az admin felületre.</p>
    </div></body></html>
  `);
});

// ── Bejelentkezés ──
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await dbGet(db, 'SELECT * FROM admin_users WHERE username = ?', [username]);
  if (!user) return res.status(401).json({ error: 'Hibás felhasználónév vagy jelszó.' });

  if (user.status === 'pending')
    return res.status(403).json({ error: 'A fiókod még nem lett jóváhagyva. Várj a szuper admin értesítésére.' });

  // Hash tisztítása token nélkül
  const cleanHash = user.password_hash.split('::token::')[0];
  const ok = await bcrypt.compare(password, cleanHash);
  if (!ok) return res.status(401).json({ error: 'Hibás felhasználónév vagy jelszó.' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, role: user.role });
});

// ── Aktuális felhasználó adatai ──
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
});

// ── Dokumentumok ──
app.get('/api/documents', async (req, res) => {
  const docs = await dbAll(db, 'SELECT doc_type, filename FROM documents');
  const result = {};
  docs.forEach(d => { result[d.doc_type] = `/uploads/${d.filename}`; });
  res.json(result);
});

// ── DIN kalkulátor ──
app.post('/api/calculate-din', (req, res) => {
  const { weight_kg, height_cm, age, skill_level, shoe_size } = req.body;
  if (!weight_kg || !height_cm || !age || !skill_level || !shoe_size)
    return res.status(400).json({ error: 'Hiányzó adatok.' });
  const din = calculateDIN(Number(weight_kg), Number(height_cm), Number(age), skill_level, Number(shoe_size));
  res.json({ din });
});

// ── Foglalás beküldése ──
app.post('/api/bookings', bookingLimiter, async (req, res) => {
  const {
    pickup_date, return_date,
    contact_name, address_zip, address_city, address_street, address_house,
    contact_phone, contact_email,
    gdpr_accepted, liability_accepted, signature_data, renters
  } = req.body;

  if (!pickup_date || !return_date || !contact_name ||
      !address_zip || !address_city || !address_street || !address_house ||
      !contact_phone || !contact_email || !renters || renters.length === 0)
    return res.status(400).json({ error: 'Hiányzó kötelező adatok.' });
  if (!gdpr_accepted || !liability_accepted)
    return res.status(400).json({ error: 'A nyilatkozatok elfogadása kötelező.' });

  try {
    const result = await dbRun(db,
      `INSERT INTO bookings
        (pickup_date, return_date, contact_name,
         address_zip, address_city, address_street, address_house,
         contact_phone, contact_email, gdpr_accepted, liability_accepted, signature_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pickup_date, return_date, contact_name,
       address_zip, address_city, address_street, address_house,
       contact_phone, contact_email,
       gdpr_accepted ? 1 : 0, liability_accepted ? 1 : 0,
       signature_data || null]
    );
    const bookingId = result.lastID;
    const savedRenters = [];
    for (const r of renters) {
      const din = calculateDIN(Number(r.weight_kg), Number(r.height_cm), Number(r.age), r.skill_level, Number(r.shoe_size));
      await dbRun(db,
        `INSERT INTO renters (booking_id, name, age, height_cm, weight_kg, shoe_size, skill_level, din_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bookingId, r.name, Number(r.age), Number(r.height_cm), Number(r.weight_kg), Number(r.shoe_size), r.skill_level, din]
      );
      savedRenters.push({ ...r, din_value: din });
    }
    try {
      await sendConfirmationEmail({
        booking_id: bookingId, contact_name, contact_email, contact_phone,
        address_zip, address_city, address_street, address_house,
        pickup_date, return_date, renters: savedRenters,
      });
    } catch (mailErr) {
      console.error('⚠️  Email hiba:', mailErr.message);
    }
    res.json({ ok: true, booking_id: bookingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mentési hiba, kérjük próbálja újra.' });
  }
});

// ── Admin: foglalások ──
app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
  const { search, from, to, status } = req.query;
  let query = `SELECT b.*, COUNT(r.id) as renter_count
               FROM bookings b LEFT JOIN renters r ON r.booking_id = b.id WHERE 1=1`;
  const params = [];
  if (search) { query += ` AND (b.contact_name LIKE ? OR b.contact_email LIKE ? OR b.contact_phone LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (from)   { query += ` AND b.pickup_date >= ?`; params.push(from); }
  if (to)     { query += ` AND b.return_date <= ?`; params.push(to); }
  if (status) { query += ` AND b.status = ?`; params.push(status); }
  query += ` GROUP BY b.id ORDER BY b.created_at DESC`;
  res.json(await dbAll(db, query, params));
});

app.get('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  const booking = await dbGet(db, 'SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) return res.status(404).json({ error: 'Nem található.' });
  const renters = await dbAll(db, 'SELECT * FROM renters WHERE booking_id = ?', [req.params.id]);
  res.json({ ...booking, renters });
});

app.patch('/api/admin/bookings/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Érvénytelen státusz.' });
  await dbRun(db, 'UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
});

// ── Foglalás törlése — CSAK SUPERADMIN ──
app.delete('/api/admin/bookings/:id', authMiddleware, superAdminOnly, async (req, res) => {
  await dbRun(db, 'DELETE FROM renters WHERE booking_id = ?', [req.params.id]);
  await dbRun(db, 'DELETE FROM bookings WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ── Admin: teszt email ──
app.post('/api/admin/test-email', authMiddleware, async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Hiányzó email cím.' });
  try {
    await sendTestEmail(to);
    res.json({ ok: true, message: `Teszt email elküldve: ${to}` });
  } catch (err) {
    res.status(500).json({ error: `Email hiba: ${err.message}` });
  }
});

// ── Admin: PDF feltöltés ──
app.post('/api/admin/documents/:docType', authMiddleware, (req, res, next) => {
  if (!['gdpr', 'liability'].includes(req.params.docType))
    return res.status(400).json({ error: 'Érvénytelen dokumentum típus.' });
  next();
}, upload.single('file'), async (req, res) => {
  const { docType } = req.params;
  await dbRun(db,
    `INSERT INTO documents (doc_type, filename) VALUES (?, ?)
     ON CONFLICT(doc_type) DO UPDATE SET filename = excluded.filename, uploaded_at = CURRENT_TIMESTAMP`,
    [docType, `${docType}.pdf`]
  );
  res.json({ ok: true, url: `/uploads/${docType}.pdf` });
});

// ── Admin: statisztikák ──
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  const total   = await dbGet(db, 'SELECT COUNT(*) as count FROM bookings');
  const today   = await dbGet(db, `SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = DATE('now')`);
  const renters = await dbGet(db, 'SELECT COUNT(*) as count FROM renters');
  const byStatus = await dbAll(db, 'SELECT status, COUNT(*) as count FROM bookings GROUP BY status');
  res.json({ total_bookings: total.count, today_bookings: today.count, total_renters: renters.count, by_status: byStatus });
});

// ── Felhasználókezelés — CSAK SUPERADMIN ──
app.get('/api/admin/users', authMiddleware, superAdminOnly, async (req, res) => {
  const users = await dbAll(db, 'SELECT id, username, email, role, status, created_at FROM admin_users ORDER BY created_at DESC');
  res.json(users);
});

app.patch('/api/admin/users/:id/role', authMiddleware, superAdminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'superadmin'].includes(role)) return res.status(400).json({ error: 'Érvénytelen szerepkör.' });
  await dbRun(db, 'UPDATE admin_users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ ok: true });
});

app.patch('/api/admin/users/:id/approve', authMiddleware, superAdminOnly, async (req, res) => {
  const user = await dbGet(db, 'SELECT * FROM admin_users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Nem található.' });
  const cleanHash = user.password_hash.split('::token::')[0];
  await dbRun(db, "UPDATE admin_users SET status = 'approved', password_hash = ? WHERE id = ?", [cleanHash, req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', authMiddleware, superAdminOnly, async (req, res) => {
  if (req.params.id == req.user.id) return res.status(400).json({ error: 'Saját magadat nem törölheted.' });
  await dbRun(db, 'DELETE FROM admin_users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ── Frontend build kiszolgálása (production: egy processz, egy port) ──
const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Keszisi backend fut: http://localhost:${PORT}`);
  console.log(`📧 Email: KONFIGURÁLVA ✅`);
  console.log(`👑 Szuper admin email: ${SUPERADMIN_EMAIL}`);
  console.log(`\n💡 Szuper admin beállítás parancs:`);
  console.log(`   node -e "const D=require('./db');const db=D.initDB();D.dbRun(db,'UPDATE admin_users SET role=\\'superadmin\\' WHERE username=\\'FELHASZNALONEV\\'').then(()=>{console.log('Kész!');process.exit()})"`);
});
