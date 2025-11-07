const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function openDb() {
  const filename = process.env.NODE_ENV === 'production' 
    ? path.join('/data', 'db.sqlite')
    : path.join(__dirname, 'db.sqlite');
  const raw = new sqlite3.Database(filename);

  const run = (sql, params = []) => new Promise((resolve, reject) => {
    raw.run(sql, params, function (err) {
      if (err) return reject(err);
      // resolve with `this` to get lastID if needed
      resolve(this);
    });
  });

  const get = (sql, params = []) => new Promise((resolve, reject) => {
    raw.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

  const all = (sql, params = []) => new Promise((resolve, reject) => {
    raw.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

  const exec = (sql) => new Promise((resolve, reject) => {
    raw.exec(sql, (err) => err ? reject(err) : resolve());
  });

  // Return an object with promisified methods and the raw handle if needed
  return { raw, run, get, all, exec };
}

// Initialize DB and create tables
async function initDb() {
  const db = openDb();

  // Ensure foreign keys and tables
  await db.exec('PRAGMA foreign_keys = ON;');

  await db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await db.run(`CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    max_players INTEGER DEFAULT 10,
    creator_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
  );`);

  await db.run(`CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, user_id),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await db.run(`CREATE TABLE IF NOT EXISTS reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, token)
  );`);

  return db;
}

module.exports = { initDb };
