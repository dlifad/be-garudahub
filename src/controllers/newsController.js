const db = require('../config/db');

exports.getAllNews = (req, res) => {
  db.all('SELECT * FROM news ORDER BY published_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

exports.getNewsById = (req, res) => {
  db.get('SELECT * FROM news WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: 'Berita tidak ditemukan' });

    res.json(row);
  });
};