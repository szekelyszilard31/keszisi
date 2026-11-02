// Szkript: szekelyszilard szuper admin fiók létrehozása
// Futtatás: node create-superadmin.js

const bcrypt = require('bcryptjs');
const { initDB, dbGet, dbRun } = require('./db');

const USERNAME = 'szekelyszilard';
const EMAIL    = 'szekelyszilard31@gmail.com';

async function main() {
  const db = initDB();

  // Kis várakozás az adatbázis init után
  await new Promise(r => setTimeout(r, 500));

  // Van már ilyen fiók?
  const existing = await dbGet(db, 'SELECT id, role FROM admin_users WHERE username = ?', [USERNAME]);

  if (existing) {
    // Frissítjük a meglévő fiókot superadminra
    await dbRun(db, "UPDATE admin_users SET role = 'superadmin', status = 'approved', email = ? WHERE username = ?",
      [EMAIL, USERNAME]);
    console.log(`✅ Meglévő fiók frissítve: ${USERNAME} → szuper admin`);
  } else {
    // Jelszó bekérése
    const password = process.argv[2];
    if (!password) {
      console.error('❌ Add meg a jelszót paraméterként:');
      console.error('   node create-superadmin.js JELSZO');
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 10);
    await dbRun(db,
      "INSERT INTO admin_users (username, email, password_hash, role, status) VALUES (?, ?, ?, 'superadmin', 'approved')",
      [USERNAME, EMAIL, hash]
    );
    console.log(`✅ Szuper admin fiók létrehozva: ${USERNAME}`);
  }

  console.log(`👑 Szerepkör: superadmin`);
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`\n✅ Kész! Most már be tudsz lépni az admin felületen.`);
  process.exit(0);
}

main().catch(e => { console.error('Hiba:', e.message); process.exit(1); });
