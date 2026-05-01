const db = require('../config/db');

exports.getAllNews = (req, res) => {
  const { source, limit = 20, offset = 0, sort = 'desc' } = req.query;

  const order = sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  let query = `
    SELECT id, title, content, author, source, source_url, image_url, published_at
    FROM news
  `;
  const params = [];

  if (source) {
    query += ' WHERE source = ?';
    params.push(source);
  }

  query += ` ORDER BY published_at ${order} LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ data: rows, total: rows.length });
  });
};

exports.getNewsById = (req, res) => {
  db.get(
    `SELECT id, title, content, author, source, source_url, image_url, published_at
     FROM news WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: 'Berita tidak ditemukan' });
      res.json(row);
    }
  );
};