const { all, run } = require("../utils/dbAsync");

const ALLOWED_TYPES = new Set(["regional", "continental", "world"]);
const ALLOWED_CONFEDERATIONS = new Set(["AFF", "AFC", "FIFA"]);
const ALLOWED_STAGES = new Set(["Group Stage", "Knockout", "Final"]);

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

exports.getTournaments = async (req, res) => {
  try {
    const rows = await all(
      `SELECT id, name, type, confederation, stage, indonesia_group, start_date, end_date,
              host_country, logo_url, is_active
       FROM tournaments
       ORDER BY start_date DESC, id DESC`,
    );

    return res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        is_active: Boolean(row.is_active),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data turnamen",
      error: error.message,
    });
  }
};

exports.createTournament = async (req, res) => {
  try {
    const {
      name,
      type,
      confederation,
      stage,
      indonesia_group,
      start_date,
      end_date,
      host_country,
      logo_url,
      season,
      description,
    } = req.body;

    if (
      !name ||
      !type ||
      !confederation ||
      !stage ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Field wajib: name, type, confederation, stage, start_date, end_date",
      });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return res
        .status(400)
        .json({ success: false, message: "type tidak valid" });
    }

    if (!ALLOWED_CONFEDERATIONS.has(confederation)) {
      return res
        .status(400)
        .json({ success: false, message: "confederation tidak valid" });
    }

    if (!ALLOWED_STAGES.has(stage)) {
      return res
        .status(400)
        .json({ success: false, message: "stage tidak valid" });
    }

    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return res
        .status(400)
        .json({ success: false, message: "Format tanggal tidak valid" });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res
        .status(400)
        .json({ success: false, message: "start_date harus <= end_date" });
    }

    const result = await run(
      `INSERT INTO tournaments
        (name, type, confederation, stage, indonesia_group, start_date, end_date, host_country, logo_url, season, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        type,
        confederation,
        stage,
        indonesia_group || null,
        start_date,
        end_date,
        host_country || null,
        logo_url || null,
        season || null,
        description || null,
      ],
    );

    const created = await all(
      `SELECT id, name, type, confederation, stage, indonesia_group, start_date, end_date,
              host_country, logo_url, is_active
       FROM tournaments WHERE id = ?`,
      [result.lastID],
    );

    return res.status(201).json({
      success: true,
      message: "Turnamen berhasil dibuat",
      data: {
        ...created[0],
        is_active: Boolean(created[0].is_active),
      },
    });
  } catch (error) {
    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        success: false,
        message: "Turnamen dengan periode yang sama sudah ada",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Gagal membuat turnamen",
      error: error.message,
    });
  }
};
