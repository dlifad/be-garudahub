const axios = require("axios");

exports.convertTicketPrice = async (req, res) => {
  try {
    const amount = Number(req.query.amount);
    const from = String(req.query.from || "IDR").toUpperCase();
    const to = String(req.query.to || "USD").toUpperCase();

    if (Number.isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "amount harus angka > 0" });
    }

    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Kode mata uang harus format ISO 3 huruf",
        });
    }

    const url = `https://open.er-api.com/v6/latest/${from}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (!response.data || response.data.result !== "success") {
      return res
        .status(502)
        .json({
          success: false,
          message: "Gagal mengambil kurs dari penyedia eksternal",
        });
    }

    const rates = response.data.rates || {};
    const rate = rates[to];

    if (!rate) {
      return res
        .status(400)
        .json({ success: false, message: "Mata uang tujuan tidak didukung" });
    }

    const converted = amount * rate;

    return res.json({
      success: true,
      from,
      to,
      amount,
      converted: Number(converted.toFixed(2)),
      rate: Number(rate.toFixed(6)),
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal melakukan konversi mata uang",
      error: error.message,
    });
  }
};
