const { all, get, run } = require("../utils/dbAsync");

const ALLOWED_TYPES = new Set(["regional", "continental", "world"]);
const ALLOWED_CONFEDERATIONS = new Set(["AFF", "AFC", "FIFA"]);
const ALLOWED_STAGES = new Set(["Group Stage", "Knockout", "Final"]);
const ALLOWED_COACH_ROLES = new Set(["head_coach", "assistant", "caretaker"]);

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

function isTruthyFlag(value) {
  return value === true || value === 1 || value === "1";
}

async function buildTournamentDetail(tournamentId) {
  const tournament = await get(
    `SELECT id, name, type, confederation, stage, indonesia_group, start_date,
            end_date, host_country, logo_url, season, description, is_active,
            created_at
     FROM tournaments
     WHERE id = ?`,
    [tournamentId],
  );

  if (!tournament) {
    return null;
  }

  const coaches = await all(
    `SELECT id, tournament_id, name, role, start_date, end_date, is_active, created_at
     FROM tournament_coaches
     WHERE tournament_id = ?
     ORDER BY COALESCE(start_date, '0000-01-01') DESC, id DESC`,
    [tournamentId],
  );

  const activeHeadCoach =
    coaches.find(
      (coach) => coach.role === "head_coach" && coach.is_active === 1,
    ) ||
    coaches.find((coach) => coach.role === "head_coach") ||
    null;

  const totalPlayersRow = await get(
    `SELECT COUNT(*) AS count
     FROM tournament_players
     WHERE tournament_id = ? AND is_active = 1`,
    [tournamentId],
  );

  const totalMatchesRow = await get(
    `SELECT COUNT(*) AS count
     FROM matches
     WHERE tournament_id = ?`,
    [tournamentId],
  );

  return {
    tournament: {
      ...tournament,
      is_active: Boolean(tournament.is_active),
    },
    head_coach: activeHeadCoach
      ? {
          ...activeHeadCoach,
          is_active: Boolean(activeHeadCoach.is_active),
        }
      : null,
    coaches: coaches.map((coach) => ({
      ...coach,
      is_active: Boolean(coach.is_active),
    })),
    total_players: Number(totalPlayersRow.count),
    total_matches: Number(totalMatchesRow.count),
  };
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

exports.getTournamentById = async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);

    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "id turnamen tidak valid" });
    }

    const detail = await buildTournamentDetail(tournamentId);

    if (!detail) {
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    }

    return res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail turnamen",
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

exports.updateTournament = async (req, res) => {
  try {
    const tournamentId = Number(req.params.id);
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
      is_active,
    } = req.body;

    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "id turnamen tidak valid" });
    }

    const existing = await get(
      `SELECT id, name, type, confederation, stage, indonesia_group, start_date,
              end_date, host_country, logo_url, season, description, is_active
       FROM tournaments
       WHERE id = ?`,
      [tournamentId],
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    }

    if (typeof name !== "undefined" && !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "name tidak boleh kosong" });
    }

    if (typeof type !== "undefined" && !ALLOWED_TYPES.has(type)) {
      return res
        .status(400)
        .json({ success: false, message: "type tidak valid" });
    }

    if (
      typeof confederation !== "undefined" &&
      !ALLOWED_CONFEDERATIONS.has(confederation)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "confederation tidak valid" });
    }

    if (typeof stage !== "undefined" && !ALLOWED_STAGES.has(stage)) {
      return res
        .status(400)
        .json({ success: false, message: "stage tidak valid" });
    }

    if (typeof start_date !== "undefined" && !isValidDate(start_date)) {
      return res
        .status(400)
        .json({ success: false, message: "Format start_date tidak valid" });
    }

    if (typeof end_date !== "undefined" && !isValidDate(end_date)) {
      return res
        .status(400)
        .json({ success: false, message: "Format end_date tidak valid" });
    }

    const nextStartDate =
      typeof start_date !== "undefined" ? start_date : existing.start_date;
    const nextEndDate =
      typeof end_date !== "undefined" ? end_date : existing.end_date;

    if (
      nextStartDate &&
      nextEndDate &&
      new Date(nextStartDate) > new Date(nextEndDate)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "start_date harus <= end_date" });
    }

    const fields = [];
    const params = [];

    if (typeof name !== "undefined") {
      fields.push("name = ?");
      params.push(name.trim());
    }

    if (typeof type !== "undefined") {
      fields.push("type = ?");
      params.push(type);
    }

    if (typeof confederation !== "undefined") {
      fields.push("confederation = ?");
      params.push(confederation);
    }

    if (typeof stage !== "undefined") {
      fields.push("stage = ?");
      params.push(stage);
    }

    if (typeof indonesia_group !== "undefined") {
      fields.push("indonesia_group = ?");
      params.push(indonesia_group || null);
    }

    if (typeof start_date !== "undefined") {
      fields.push("start_date = ?");
      params.push(start_date);
    }

    if (typeof end_date !== "undefined") {
      fields.push("end_date = ?");
      params.push(end_date);
    }

    if (typeof host_country !== "undefined") {
      fields.push("host_country = ?");
      params.push(host_country || null);
    }

    if (typeof logo_url !== "undefined") {
      fields.push("logo_url = ?");
      params.push(logo_url || null);
    }

    if (typeof season !== "undefined") {
      fields.push("season = ?");
      params.push(season || null);
    }

    if (typeof description !== "undefined") {
      fields.push("description = ?");
      params.push(description || null);
    }

    if (typeof is_active !== "undefined") {
      fields.push("is_active = ?");
      params.push(isTruthyFlag(is_active) ? 1 : 0);
    }

    if (!fields.length) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada field yang ingin diperbarui",
      });
    }

    params.push(tournamentId);

    await run(
      `UPDATE tournaments
       SET ${fields.join(", ")}
       WHERE id = ?`,
      params,
    );

    const detail = await buildTournamentDetail(tournamentId);

    return res.json({
      success: true,
      message: "Turnamen berhasil diperbarui",
      data: detail,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui turnamen",
      error: error.message,
    });
  }
};

exports.getTournamentCoaches = async (req, res) => {
  try {
    const tournamentId = Number(req.params.tournament_id);

    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "tournament_id tidak valid" });
    }

    const tournament = await get(
      "SELECT id, name FROM tournaments WHERE id = ?",
      [tournamentId],
    );
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    }

    const coaches = await all(
      `SELECT id, tournament_id, name, role, start_date, end_date, is_active, created_at
       FROM tournament_coaches
       WHERE tournament_id = ?
       ORDER BY COALESCE(start_date, '0000-01-01') DESC, id DESC`,
      [tournamentId],
    );

    return res.json({
      success: true,
      tournament: tournament.name,
      data: coaches.map((coach) => ({
        ...coach,
        is_active: Boolean(coach.is_active),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data pelatih turnamen",
      error: error.message,
    });
  }
};

exports.addTournamentCoach = async (req, res) => {
  try {
    const tournamentId = Number(req.params.tournament_id);
    const {
      name,
      role = "head_coach",
      start_date,
      end_date,
      is_active,
    } = req.body;

    if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "tournament_id tidak valid" });
    }

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Field wajib: name" });
    }

    if (!ALLOWED_COACH_ROLES.has(role)) {
      return res
        .status(400)
        .json({ success: false, message: "role coach tidak valid" });
    }

    if (start_date && !isValidDate(start_date)) {
      return res
        .status(400)
        .json({ success: false, message: "Format start_date tidak valid" });
    }

    if (end_date && !isValidDate(end_date)) {
      return res
        .status(400)
        .json({ success: false, message: "Format end_date tidak valid" });
    }

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return res
        .status(400)
        .json({ success: false, message: "start_date harus <= end_date" });
    }

    const tournament = await get("SELECT id FROM tournaments WHERE id = ?", [
      tournamentId,
    ]);
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    }

    const activeFlag =
      typeof is_active === "undefined"
        ? 1
        : is_active === true || is_active === 1 || is_active === "1"
          ? 1
          : 0;

    if (role === "head_coach" && activeFlag === 1) {
      await run(
        `UPDATE tournament_coaches
         SET is_active = 0,
             end_date = COALESCE(end_date, ?)
         WHERE tournament_id = ? AND role = 'head_coach' AND is_active = 1`,
        [start_date || new Date().toISOString().slice(0, 10), tournamentId],
      );
    }

    const result = await run(
      `INSERT INTO tournament_coaches
       (tournament_id, name, role, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tournamentId,
        name.trim(),
        role,
        start_date || null,
        end_date || null,
        activeFlag,
      ],
    );

    const created = await get(
      `SELECT id, tournament_id, name, role, start_date, end_date, is_active, created_at
       FROM tournament_coaches
       WHERE id = ?`,
      [result.lastID],
    );

    return res.status(201).json({
      success: true,
      message: "Pelatih turnamen berhasil ditambahkan",
      data: {
        ...created,
        is_active: Boolean(created.is_active),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menambah pelatih turnamen",
      error: error.message,
    });
  }
};
