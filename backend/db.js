const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'keszisi.db');

function initDB() {
  const db = new sqlite3.Database(DB_PATH);

  // Promise-alapú futtatás
  db.run = (function(origRun) {
    return function(sql, params, cb) {
      return origRun.call(this, sql, params || [], cb);
    };
  })(db.run);

  // Szinkron inicializálás serialize-zal
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      pickup_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      address_zip TEXT NOT NULL,
      address_city TEXT NOT NULL,
      address_street TEXT NOT NULL,
      address_house TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      gdpr_accepted INTEGER NOT NULL DEFAULT 0,
      liability_accepted INTEGER NOT NULL DEFAULT 0,
      signature_data TEXT,
      status TEXT DEFAULT 'new'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS renters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      height_cm INTEGER NOT NULL,
      weight_kg INTEGER NOT NULL,
      shoe_size REAL NOT NULL,
      skill_level TEXT NOT NULL,
      din_value REAL NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_type TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  return db;
}

// Promise wrapper segédfüggvények
function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { initDB, dbGet, dbAll, dbRun, DB_PATH };
