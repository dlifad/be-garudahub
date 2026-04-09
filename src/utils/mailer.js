const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, code, name) {
  const mailOptions = {
    from: `"GarudaHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Kode Verifikasi Email GarudaHub',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Halo, ${name}</h2>
        <p>Terima kasih telah mendaftar di <b>GarudaHub</b>.</p>
        <p>Berikut adalah kode verifikasi email kamu:</p>
        <h1 style="letter-spacing: 5px; color: #d32f2f;">${code}</h1>
        <p>Kode ini berlaku selama <b>10 menit</b>.</p>
        <p>Jangan bagikan kode ini ke siapa pun.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };