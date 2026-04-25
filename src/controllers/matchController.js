const { all, get, run } = require("../utils/dbAsync");
const {
  formatWithOffset,
  isValidTimezone,
  toISO,
} = require("../utils/datetime");

const STATUS_VALUES = new Set(["scheduled", "ongoing", "finished"]);
const LINEUP_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);

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

  const prices = [
    row.ticket_cat1,
    row.ticket_cat2,
    row.ticket_cat3,
    row.ticket_VIP,
  ].filter((v) => v !== null);

  const minPrice = prices.length ? Math.min(...prices) : null;

  return {
    id: row.id,
    tournament_id: row.tournament_id,
    tournament_name: row.tournament_name,
    tournament_logo: row.tournament_logo,
    head_coach: row.head_coach_name || null,
    matchday: row.matchday,
    round: row.round,
    is_home: isHome,
    home_team: row.home_team,
    away_team: row.away_team,
    home_team_flag: row.home_team_flag,
    away_team_flag: row.away_team_flag,
    match_date_utc: row.match_date_utc,
    match_date_local: formatWithOffset(row.match_date_utc, timezone),
    venue: row.venue_name,
    stadium: {
      name: row.venue_name,
      city: row.city,
      latitude: row.latitude,
      longitude: row.longitude,
    },
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    indonesia_score: indonesiaScore,
    opponent_score: opponentScore,
    result,
    min_ticket_price: minPrice,
    tickets: {
      cat1: row.ticket_cat1,
      cat2: row.ticket_cat2,
      cat3: row.ticket_cat3,
      vip: row.ticket_VIP,
    },
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

    const { has_ticket } = req.query;

    const { upcoming } = req.query;

    if (upcoming === "true") {
      where.push(`
        m.status = 'scheduled'
        AND datetime(m.match_date_utc) > datetime('now')
      `);
    }

    if (has_ticket === "true") {
      where.push(`
        (
          m.ticket_cat1 IS NOT NULL OR
          m.ticket_cat2 IS NOT NULL OR
          m.ticket_cat3 IS NOT NULL OR
          m.ticket_VIP IS NOT NULL
        )
      `);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await all(
      `SELECT m.*, t.name AS tournament_name, t.logo_url AS tournament_logo,
              tc.name AS head_coach_name,
              v.name AS venue_name, v.city, v.latitude, v.longitude
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN venues v ON v.id = m.venue_id
       LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id
         AND tc.role = 'head_coach' AND tc.is_active = 1
       ${whereClause}
       ORDER BY m.match_date_utc ASC`,
      params,
    );

    return res.json({
      success: true,
      data: rows.map((row) => mapMatchRow(row, timezone)),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data pertandingan",
      error: error.message,
    });
  }
};

exports.getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const timezone = req.query.timezone || "UTC";

    if (!isValidTimezone(timezone)) {
      return res
        .status(400)
        .json({ success: false, message: "timezone tidak valid" });
    }

    const row = await get(
      `SELECT m.*, t.name AS tournament_name,
              tc.name AS head_coach_name,
              v.name AS venue_name, v.city, v.latitude, v.longitude
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN venues v ON v.id = m.venue_id
       LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id
         AND tc.role = 'head_coach' AND tc.is_active = 1
       WHERE m.id = ?`,
      [id],
    );

    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    return res.json({
      success: true,
      data: mapMatchRow(row, timezone),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail pertandingan",
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
      venue_id,
      ticket_cat1,
      ticket_cat2,
      ticket_cat3,
      ticket_VIP,
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
        home_team_flag, away_team_flag, match_date_utc, venue_id,
        ticket_cat1, ticket_cat2, ticket_cat3, ticket_VIP)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        venue_id || null,
        ticket_cat1 || null,
        ticket_cat2 || null,
        ticket_cat3 || null,
        ticket_VIP || null,
      ],
    );

    const created = await get(
      `SELECT m.*, t.name AS tournament_name,
              tc.name AS head_coach_name
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id
         AND tc.role = 'head_coach' AND tc.is_active = 1
       WHERE m.id = ?`,
      [inserted.lastID],
    );

    return res.status(201).json({
      success: true,
      message: "Pertandingan berhasil dibuat",
      data: mapMatchRow(created, "UTC"),
    });
  } catch (error) {
    return res.status(500).json({
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
      `SELECT m.*, t.name AS tournament_name,
              tc.name AS head_coach_name
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id
         AND tc.role = 'head_coach' AND tc.is_active = 1
       WHERE m.id = ?`,
      [id],
    );

    return res.json({
      success: true,
      message: "Pertandingan berhasil diperbarui",
      data: mapMatchRow(updated, "UTC"),
    });
  } catch (error) {
    return res.status(500).json({
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

    const row = await get(
      `SELECT m.*, tc.name AS head_coach_name
       FROM matches m
       LEFT JOIN tournaments t ON t.id = m.tournament_id
       LEFT JOIN tournament_coaches tc ON tc.tournament_id = t.id
         AND tc.role = 'head_coach' AND tc.is_active = 1
       WHERE m.id = ?`,
      [id],
    );
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    const matchName = `${row.home_team} vs ${row.away_team}`;

    return res.json({
      success: true,
      match: matchName,
      head_coach: row.head_coach_name || null,
      utc: row.match_date_utc,
      wib: formatWithOffset(row.match_date_utc, "Asia/Jakarta"),
      wita: formatWithOffset(row.match_date_utc, "Asia/Makassar"),
      wit: formatWithOffset(row.match_date_utc, "Asia/Jayapura"),
      requested_timezone: timezone,
      local: formatWithOffset(row.match_date_utc, timezone),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil jadwal lokal",
      error: error.message,
    });
  }
};

exports.setMatchLineup = async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const {
      player_id,
      is_starting_eleven,
      jersey_number,
      position,
      is_active,
    } = req.body;

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "id pertandingan tidak valid" });
    }

    const playerIdNum = Number(player_id);
    if (!Number.isInteger(playerIdNum) || playerIdNum <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "player_id tidak valid" });
    }

    if (position && !LINEUP_POSITIONS.has(position)) {
      return res
        .status(400)
        .json({ success: false, message: "position lineup tidak valid" });
    }

    const match = await get(
      "SELECT id, tournament_id, home_team, away_team FROM matches WHERE id = ?",
      [matchId],
    );
    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    const player = await get(
      "SELECT id, name, position FROM players WHERE id = ?",
      [playerIdNum],
    );
    if (!player) {
      return res
        .status(404)
        .json({ success: false, message: "Pemain tidak ditemukan" });
    }

    const squadLink = await get(
      `SELECT id
       FROM tournament_players
       WHERE tournament_id = ? AND player_id = ?`,
      [match.tournament_id, playerIdNum],
    );

    if (!squadLink) {
      return res.status(409).json({
        success: false,
        message: "Pemain belum terdaftar di squad turnamen match ini",
      });
    }

    const isStarting =
      typeof is_starting_eleven === "undefined"
        ? 1
        : is_starting_eleven === true ||
            is_starting_eleven === 1 ||
            is_starting_eleven === "1"
          ? 1
          : 0;

    const isActive =
      typeof is_active === "undefined"
        ? 1
        : is_active === true || is_active === 1 || is_active === "1"
          ? 1
          : 0;

    if (typeof jersey_number === "undefined" || jersey_number === null) {
      return res
        .status(400)
        .json({ success: false, message: "jersey_number wajib diisi" });
    }

    const jerseyNumber = Number(jersey_number);

    if (
      typeof jerseyNumber !== "undefined" &&
      jerseyNumber !== null &&
      (Number.isNaN(jerseyNumber) || jerseyNumber <= 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "jersey_number tidak valid" });
    }

    await run(
      `INSERT INTO match_lineups
       (match_id, player_id, tournament_id, is_starting_eleven, jersey_number, position, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(match_id, player_id) DO UPDATE SET
         is_starting_eleven = excluded.is_starting_eleven,
         jersey_number = excluded.jersey_number,
         position = excluded.position,
         is_active = excluded.is_active`,
      [
        matchId,
        playerIdNum,
        match.tournament_id,
        isStarting,
        jerseyNumber,
        position || player.position,
        isActive,
      ],
    );

    const lineupPlayer = await get(
      `SELECT ml.match_id, ml.player_id, ml.tournament_id, ml.is_starting_eleven,
              ml.jersey_number, ml.position, ml.is_active,
              p.name AS player_name
       FROM match_lineups ml
       JOIN players p ON p.id = ml.player_id
       WHERE ml.match_id = ? AND ml.player_id = ?`,
      [matchId, playerIdNum],
    );

    return res.status(201).json({
      success: true,
      message: "Lineup pemain berhasil disimpan",
      data: {
        ...lineupPlayer,
        is_starting_eleven: Boolean(lineupPlayer.is_starting_eleven),
        is_active: Boolean(lineupPlayer.is_active),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan lineup pemain",
      error: error.message,
    });
  }
};

exports.getMatchLineup = async (req, res) => {
  try {
    const matchId = Number(req.params.id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "id pertandingan tidak valid" });
    }

    const match = await get(
      `SELECT m.id, m.tournament_id, t.name AS tournament_name,
              m.home_team, m.away_team, m.match_date_utc, m.status
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.id = ?`,
      [matchId],
    );

    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    const rows = await all(
      `SELECT ml.player_id, ml.is_starting_eleven, ml.jersey_number,
              ml.position AS lineup_position, ml.is_active,
              p.name, p.nickname, p.position AS player_position,
              p.current_club, p.photo_url
       FROM match_lineups ml
       JOIN players p ON p.id = ml.player_id
       WHERE ml.match_id = ? AND ml.is_active = 1
       ORDER BY ml.is_starting_eleven DESC, ml.jersey_number ASC, p.name ASC`,
      [matchId],
    );

    const players = rows.map((row) => ({
      player_id: row.player_id,
      name: row.name,
      nickname: row.nickname,
      position: row.lineup_position || row.player_position,
      jersey_number: row.jersey_number,
      current_club: row.current_club,
      photo_url: row.photo_url,
      is_starting_eleven: Boolean(row.is_starting_eleven),
      is_active: Boolean(row.is_active),
    }));

    return res.json({
      success: true,
      match,
      total_players: players.length,
      starting_xi: players.filter((player) => player.is_starting_eleven),
      substitutes: players.filter((player) => !player.is_starting_eleven),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil lineup pertandingan",
      error: error.message,
    });
  }
};

exports.deleteMatchLineup = async (req, res) => {
  try {
    const matchId = Number(req.params.id);
    const playerIdNum = Number(req.params.player_id);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "id pertandingan tidak valid" });
    }

    if (!Number.isInteger(playerIdNum) || playerIdNum <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "player_id tidak valid" });
    }

    const existing = await get(
      `SELECT match_id, player_id
       FROM match_lineups
       WHERE match_id = ? AND player_id = ?`,
      [matchId, playerIdNum],
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Pemain tidak ada di lineup pertandingan ini",
      });
    }

    await run(
      `DELETE FROM match_lineups
       WHERE match_id = ? AND player_id = ?`,
      [matchId, playerIdNum],
    );

    return res.json({
      success: true,
      message: "Pemain berhasil dihapus dari lineup pertandingan",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menghapus pemain dari lineup pertandingan",
      error: error.message,
    });
  }
};
