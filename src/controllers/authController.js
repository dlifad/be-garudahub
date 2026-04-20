const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../utils/mailer');

// helper generate OTP 6 digit
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// helper validasi email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Format email tidak valid' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
    if (err) return res.status(500).json({ message: err.message });

    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

    db.run(
      `INSERT INTO users (name, email, password, verification_code, verification_expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, verificationCode, expiresAt],
      async function (err) {
        if (err) return res.status(500).json({ message: err.message });

        try {
          await sendVerificationEmail(email, verificationCode, name);

          res.status(201).json({
            message: 'Register berhasil. Kode verifikasi telah dikirim ke email.',
            user: {
              id: this.lastID,
              name,
              email,
              is_verified: 0,
            },
          });
        } catch (emailError) {
          return res.status(500).json({
            message: 'User berhasil dibuat, tetapi gagal mengirim email verifikasi',
            error: emailError.message,
          });
        }
      }
    );
  });
};

exports.verifyEmail = (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email dan kode wajib diisi' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.is_verified === 1) {
      return res.status(400).json({ message: 'Email sudah diverifikasi' });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ message: 'Kode verifikasi salah' });
    }

    const now = new Date();
    const expiresAt = new Date(user.verification_expires_at);

    if (now > expiresAt) {
      return res.status(400).json({ message: 'Kode verifikasi sudah kedaluwarsa' });
    }

    db.run(
      `UPDATE users
       SET is_verified = 1,
           verification_code = NULL,
           verification_expires_at = NULL
       WHERE email = ?`,
      [email],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });

        res.json({ message: 'Email berhasil diverifikasi. Sekarang kamu bisa login.' });
      }
    );
  });
};

exports.resendCode = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email wajib diisi' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.is_verified === 1) {
      return res.status(400).json({ message: 'Email sudah diverifikasi' });
    }

    const newCode = generateOTP();
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.run(
      `UPDATE users
       SET verification_code = ?, verification_expires_at = ?
       WHERE email = ?`,
      [newCode, newExpiresAt, email],
      async function (err) {
        if (err) return res.status(500).json({ message: err.message });

        try {
          await sendVerificationEmail(email, newCode, user.name);

          res.json({ message: 'Kode verifikasi baru berhasil dikirim' });
        } catch (emailError) {
          return res.status(500).json({
            message: 'Gagal mengirim ulang kode verifikasi',
            error: emailError.message,
          });
        }
      }
    );
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah' });
    }

    if (user.is_verified !== 1) {
      return res.status(403).json({
        message: 'Email belum diverifikasi. Silakan verifikasi dulu.',
      });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_photo: user.profile_photo,
        is_verified: user.is_verified,
      },
    });
  });
};

exports.me = (req, res) => {
  db.get(
    'SELECT id, name, email, profile_photo, is_verified, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

      res.json(user);
    }
  );
};

exports.logout = (req, res) => {
  try {
    return res.status(200).json({
      message: 'Logout berhasil',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Terjadi kesalahan saat logout',
    });
  }
};

exports.changePassword = (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      message: 'Password lama dan password baru wajib diisi',
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      message: 'Password baru minimal 6 karakter',
    });
  }

  db.get(
    'SELECT * FROM users WHERE id = ?',
    [req.user.id],
    async (err, user) => {
      if (err) return res.status(500).json({ message: err.message });

      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      const isMatch = await bcrypt.compare(current_password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: 'Password lama salah',
        });
      }

      const isSamePassword = await bcrypt.compare(new_password, user.password);

      if (isSamePassword) {
        return res.status(400).json({
          message: 'Password baru tidak boleh sama dengan password lama',
        });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id],
        function (err) {
          if (err) return res.status(500).json({ message: err.message });

          return res.json({
            message: 'Password berhasil diubah',
          });
        }
      );
    }
  );
};