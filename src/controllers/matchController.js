const { all, get, run } = require("../utils/dbAsync");
const {
  formatWithOffset,
  isValidTimezone,
  toISO,
} = require("../utils/datetime");

const STATUS_VALUES = new Set(["scheduled", "ongoing", "finished"]);

function mapMatchRow(row, timezone) {
  const isHome = Boolean(row.is_home);
  const indonesiaScore = isHome ? row.home_score : row.away_score;
  const opponentScore = isHome ? row.away_score : row.home_score;

  let result = null;
  if (
    row.status === "finished" &&
    indonesiaScore !== null &&
    opponentScore !== null
  ) {
    if (indonesiaScore > opponentScore) {
      result = "WIN";
    } else if (indonesiaScore < opponentScore) {
      result = "LOSS";
    } else {
      result = "DRAW";
    }
  }

  return {
    id: row.id,
    tournament_id: row.tournament_id,
    tournament_name: row.tournament_name,
    matchday: row.matchday,
    round: row.round,
    is_home: isHome,
    home_team: row.home_team,
    away_team: row.away_team,
    home_team_flag: row.home_team_flag,
    away_team_flag: row.away_team_flag,
    match_date_utc: row.match_date_utc,
    match_date_local: formatWithOffset(row.match_date_utc, timezone),
    venue: row.venue,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    indonesia_score: indonesiaScore,
    opponent_score: opponentScore,
    result,
    ticket_price_idr: row.ticket_price_idr,
  };
}

exports.getMatches = async (req, res) => {
  try {
    const { tournament_id, status, is_home, date } = req.query;
    const timezone = req.query.timezone || "UTC";

    if (!isValidTimezone(timezone)) {
      return res
        .status(400)
        .json({ success: false, message: "timezone tidak valid" });
    }

    if (status && !STATUS_VALUES.has(status)) {
      return res
        .status(400)
        .json({ success: false, message: "status tidak valid" });
    }

    const where = [];
    const params = [];

    if (tournament_id) {
      where.push("m.tournament_id = ?");
      params.push(Number(tournament_id));
    }

    if (status) {
      where.push("m.status = ?");
      params.push(status);
    }

    if (typeof is_home !== "undefined") {
      if (!["true", "false"].includes(String(is_home))) {
        return res
          .status(400)
          .json({ success: false, message: "is_home harus true/false" });
      }

      where.push("m.is_home = ?");
      params.push(String(is_home) === "true" ? 1 : 0);
    }

    if (date) {
      where.push("date(m.match_date_utc) = date(?)");
      params.push(date);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await all(
      `SELECT m.*, t.name AS tournament_name
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       ${whereClause}
       ORDER BY m.match_date_utc ASC`,
      params,
    );

    return res.json({
      success: true,
      data: rows.map((row) => mapMatchRow(row, timezone)),
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil data pertandingan",
        error: error.message,
      });
  }
};

exports.createMatch = async (req, res) => {
  try {
    const {
      tournament_id,
      matchday,
      round,
      is_home,
      opponent,
      opponent_flag,
      match_date_utc,
      venue,
      ticket_price_idr,
    } = req.body;

    if (typeof is_home !== "boolean") {
      return res
        .status(400)
        .json({ success: false, message: "is_home wajib boolean" });
    }

    if (!tournament_id || !opponent || !match_date_utc) {
      return res.status(400).json({
        success: false,
        message:
          "Field wajib: tournament_id, opponent, match_date_utc, is_home",
      });
    }

    if (opponent.trim().toLowerCase() === "indonesia") {
      return res
        .status(400)
        .json({ success: false, message: "Opponent tidak boleh Indonesia" });
    }

    const tournament = await get(
      "SELECT id, name FROM tournaments WHERE id = ?",
      [tournament_id],
    );
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    }

    const iso = toISO(match_date_utc);
    if (!iso) {
      return res
        .status(400)
        .json({ success: false, message: "match_date_utc tidak valid" });
    }

    const overlap = await get(
      "SELECT id FROM matches WHERE tournament_id = ? AND match_date_utc = ?",
      [tournament_id, iso],
    );

    if (overlap) {
      return res.status(409).json({
        success: false,
        message:
          "Jadwal bentrok dengan pertandingan lain di turnamen yang sama",
      });
    }

    const homeTeam = is_home ? "Indonesia" : opponent;
    const awayTeam = is_home ? opponent : "Indonesia";

    const inserted = await run(
      `INSERT INTO matches
       (tournament_id, matchday, round, is_home, home_team, away_team, opponent, opponent_flag,
        home_team_flag, away_team_flag, match_date_utc, venue, stadium_name, ticket_price_idr)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tournament_id,
        matchday || null,
        round || null,
        is_home ? 1 : 0,
        homeTeam,
        awayTeam,
        opponent,
        opponent_flag || null,
        is_home ? "IDN" : opponent_flag || null,
        is_home ? opponent_flag || null : "IDN",
        iso,
        venue || null,
        venue || null,
        ticket_price_idr || null,
      ],
    );

    const created = await get(
      `SELECT m.*, t.name AS tournament_name
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.id = ?`,
      [inserted.lastID],
    );

    return res.status(201).json({
      success: true,
      message: "Pertandingan berhasil dibuat",
      data: mapMatchRow(created, "UTC"),
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal membuat pertandingan",
        error: error.message,
      });
  }
};

exports.updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, home_score, away_score } = req.body;

    if (!status || !STATUS_VALUES.has(status)) {
      return res
        .status(400)
        .json({ success: false, message: "status tidak valid" });
    }

    const match = await get("SELECT * FROM matches WHERE id = ?", [id]);
    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    if (
      status === "finished" &&
      (home_score === undefined || away_score === undefined)
    ) {
      return res.status(400).json({
        success: false,
        message: "home_score dan away_score wajib saat status finished",
      });
    }

    const parsedHome =
      home_score === undefined ? match.home_score : Number(home_score);
    const parsedAway =
      away_score === undefined ? match.away_score : Number(away_score);

    if (
      (home_score !== undefined &&
        (Number.isNaN(parsedHome) || parsedHome < 0)) ||
      (away_score !== undefined && (Number.isNaN(parsedAway) || parsedAway < 0))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Skor tidak valid" });
    }

    await run(
      `UPDATE matches
       SET status = ?, home_score = ?, away_score = ?
       WHERE id = ?`,
      [status, parsedHome, parsedAway, id],
    );

    const updated = await get(
      `SELECT m.*, t.name AS tournament_name
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.id = ?`,
      [id],
    );

    return res.json({
      success: true,
      message: "Pertandingan berhasil diperbarui",
      data: mapMatchRow(updated, "UTC"),
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal memperbarui pertandingan",
        error: error.message,
      });
  }
};

exports.getLocalSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const timezone = req.query.timezone || "Asia/Jakarta";

    if (!isValidTimezone(timezone)) {
      return res
        .status(400)
        .json({ success: false, message: "timezone tidak valid" });
    }

    const row = await get("SELECT * FROM matches WHERE id = ?", [id]);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    const matchName = `${row.home_team} vs ${row.away_team}`;

    return res.json({
      success: true,
      match: matchName,
      utc: row.match_date_utc,
      wib: formatWithOffset(row.match_date_utc, "Asia/Jakarta"),
      wita: formatWithOffset(row.match_date_utc, "Asia/Makassar"),
      wit: formatWithOffset(row.match_date_utc, "Asia/Jayapura"),
      requested_timezone: timezone,
      local: formatWithOffset(row.match_date_utc, timezone),
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil jadwal lokal",
        error: error.message,
      });
  }
};
