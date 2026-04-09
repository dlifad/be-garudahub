const db = require('../config/db');

exports.getProfile = (req, res) => {
  db.get(
    'SELECT id, name, email, profile_photo, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

      res.json(user);
    }
  );
};

exports.updateProfile = (req, res) => {
  const { name, profile_photo } = req.body;

  db.run(
    `UPDATE users 
     SET name = ?, profile_photo = ?
     WHERE id = ?`,
    [name, profile_photo, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ message: 'Profil berhasil diperbarui' });
    }
  );
};