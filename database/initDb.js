const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "garudahub.db");
const sqlPath = path.join(__dirname, "init.sql");

const db = new sqlite3.Database(dbPath);

const initSql = fs.readFileSync(sqlPath, "utf-8");

db.exec(`DROP TABLE IF EXISTS tournament_players;\n${initSql}`, (err) => {
  if (err) {
    console.error("Gagal membuat tabel:", err.message);
  } else {
    console.log("Tabel berhasil dibuat");
  }
  db.close();
});
