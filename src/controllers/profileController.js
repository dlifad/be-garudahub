const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { sendVerificationEmail } = require('../utils/mailer');

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


// REQUEST EMAIL UPDATE
exports.requestEmailUpdate = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email wajib diisi' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Format email tidak valid' });
  }

  // ambil email lama dari DB
  db.get('SELECT email FROM users WHERE id = ?', [req.user.id], (err, currentUser) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!currentUser) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (currentUser.email === email) {
      return res.status(400).json({ message: 'Email tidak boleh sama' });
    }

    // cek email sudah dipakai
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existing) => {
      if (err) return res.status(500).json({ message: err.message });

      if (existing) {
        return res.status(400).json({ message: 'Email sudah digunakan' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.run(
        `UPDATE users 
         SET verification_code = ?, verification_expires_at = ? 
         WHERE id = ?`,
        [code, expiresAt, req.user.id],
        async (err) => {
          if (err) return res.status(500).json({ message: err.message });

          try {
            await sendVerificationEmail(email, code, req.user.name);

            res.json({
              message: 'OTP dikirim ke email baru',
            });
          } catch (e) {
            res.status(500).json({ message: 'Gagal kirim email' });
          }
        }
      );
    });
  });
};

// VERIFY EMAIL UPDATE
exports.verifyEmailUpdate = (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email dan kode wajib diisi' });
  }

  db.get(
    'SELECT * FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ message: err.message });

      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      if (user.verification_code !== code) {
        return res.status(400).json({ message: 'Kode salah' });
      }

      const now = new Date();
      const expiresAt = new Date(user.verification_expires_at);

      if (now > expiresAt) {
        return res.status(400).json({ message: 'Kode kadaluarsa' });
      }

      // cek email sudah dipakai
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, existing) => {
        if (err) return res.status(500).json({ message: err.message });

        if (existing) {
          return res.status(400).json({ message: 'Email sudah digunakan' });
        }

        db.run(
          `UPDATE users 
           SET email = ?, 
               is_verified = 1,
               verification_code = NULL,
               verification_expires_at = NULL
           WHERE id = ?`,
          [email, req.user.id],
          function (err) {
            if (err) return res.status(500).json({ message: err.message });

            db.get(
              `SELECT id, name, email, profile_photo, is_verified, created_at 
               FROM users WHERE id = ?`,
              [req.user.id],
              (err, updatedUser) => {
                if (err) return res.status(500).json({ message: err.message });

                res.json(updatedUser);
              }
            );
          }
        );
      });
    }
  );
};