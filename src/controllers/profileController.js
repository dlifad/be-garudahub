const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const deleteOldPhoto = (url) => {
  if (!url) return;

  const relativePath = url.startsWith('/') ? url.substring(1) : url;

  const fullPath = path.join(__dirname, '../../', relativePath);

  fs.unlink(fullPath, (err) => {
    if (err) console.log('Gagal hapus foto lama:', err.message);
  });
};

// GET PROFILE
exports.getProfile = (req, res) => {
  db.get(
    `SELECT id, name, email, profile_photo, is_verified, created_at 
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

      res.json(user);
    }
  );
};

// UPDATE PROFILE
exports.updateProfile = (req, res) => {
  const name = req.body.name;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Nama tidak boleh kosong' });
  }

  db.get(
    'SELECT profile_photo FROM users WHERE id = ?',
    [req.user.id],
    (err, oldUser) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!oldUser) return res.status(404).json({ message: 'User tidak ditemukan' });

      let newPhoto = oldUser.profile_photo;

      // HAPUS FOTO
      if (!req.file && req.body.remove_photo === 'true') {
        deleteOldPhoto(oldUser.profile_photo);
        newPhoto = null;
      }

      // UPLOAD FOTO BARU
      if (req.file) {
        deleteOldPhoto(oldUser.profile_photo);

        newPhoto = `/uploads/profile/${req.file.filename}`;
      }

      // UPDATE DATABASE
      db.run(
        `UPDATE users SET name = ?, profile_photo = ? WHERE id = ?`,
        [name, newPhoto, req.user.id],
        function (err) {
          if (err) return res.status(500).json({ message: err.message });

          // ambil data terbaru
          db.get(
            `SELECT id, name, email, profile_photo, is_verified, created_at 
             FROM users WHERE id = ?`,
            [req.user.id],
            (err, user) => {
              if (err) return res.status(500).json({ message: err.message });

              res.json(user);
            }
          );
        }
      );
    }
  );
};