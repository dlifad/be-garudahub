const db = require('../config/db');

exports.getAllMerchandise = (req, res) => {
  db.all(
    'SELECT * FROM merchandise ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

exports.getMerchandiseById = (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM merchandise WHERE id = ?',
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: 'Merchandise tidak ditemukan' });

      res.json(row);
    }
  );
};
