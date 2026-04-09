const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/garudahub.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Gagal konek ke SQLite:', err.message);
  } else {
    console.log('Terhubung ke SQLite');
  }
});

module.exports = db;