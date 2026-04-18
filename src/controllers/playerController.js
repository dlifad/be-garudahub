const { all, get, run } = require("../utils/dbAsync");

const ALLOWED_POSITIONS = new Set(["GK", "DEF", "MID", "FWD"]);

function toBool(value) {
  if (value === "true" || value === true || value === 1 || value === "1") {
    return 1;
  }
  if (value === "false" || value === false || value === 0 || value === "0") {
    return 0;
  }
  return null;
}

exports.getPlayers = async (req, res) => {
  try {
    const { position, tournament_id, club } = req.query;
    const isActive = req.query.is_active;

    if (position && !ALLOWED_POSITIONS.has(position)) {
      return res
        .status(400)
        .json({ success: false, message: "position tidak valid" });
    }

    const where = [];
    const params = [];

    if (position) {
      where.push("position = ?");
      params.push(position);
    }

    if (tournament_id) {
      where.push("tournament_id = ?");
      params.push(Number(tournament_id));
    }

    if (typeof isActive !== "undefined") {
      const parsed = toBool(isActive);
      if (parsed === null) {
        return res
          .status(400)
          .json({ success: false, message: "is_active harus true/false" });
      }
      where.push("is_active = ?");
      params.push(parsed);
    }

    if (club) {
      where.push("(current_club LIKE ? OR club LIKE ?)");
      params.push(`%${club}%`, `%${club}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await all(
      `SELECT * FROM players
       ${whereClause}
       ORDER BY jersey_number ASC`,
      params,
    );

    return res.json({
      success: true,
      data: rows.map((row) => {
        // Hilangkan origin_country dari response meski masih ada di DB
        const { origin_country, ...rest } = row;
        return {
          ...rest,
          is_naturalized: Boolean(row.is_naturalized),
          is_active: Boolean(row.is_active),
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data pemain",
      error: error.message,
    });
  }
};

exports.createPlayer = async (req, res) => {
  try {
    const {
      tournament_id,
      name,
      nickname,
      position,
      jersey_number,
      date_of_birth,
      is_naturalized,
      current_club,
      club_country,
      caps,
      goals,
      photo_url,
      is_active,
      status,
    } = req.body;

    if (!name || !position || jersey_number === undefined) {
      return res.status(400).json({
        success: false,
        message: "Field wajib: name, position, jersey_number",
      });
    }

    if (!ALLOWED_POSITIONS.has(position)) {
      return res
        .status(400)
        .json({ success: false, message: "position tidak valid" });
    }

    const existingName = await get(
      "SELECT id FROM players WHERE LOWER(name) = LOWER(?)",
      [name.trim()],
    );
    if (existingName) {
      return res
        .status(409)
        .json({ success: false, message: "Nama pemain sudah ada" });
    }

    const existingJersey = await get(
      "SELECT id FROM players WHERE jersey_number = ? AND is_active = 1",
      [Number(jersey_number)],
    );
    if (existingJersey) {
      return res.status(409).json({
        success: false,
        message: "Nomor punggung sudah dipakai pemain aktif",
      });
    }

    const result = await run(
      `INSERT INTO players
       (tournament_id, name, nickname, position, jersey_number, date_of_birth, nationality,
        is_naturalized, current_club, club, club_country, caps, goals, photo_url,
        is_active, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Indonesia', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tournament_id || null,
        name.trim(),
        nickname || null,
        position,
        Number(jersey_number),
        date_of_birth || null,
        is_naturalized ? 1 : 0,
        current_club || null,
        current_club || null,
        club_country || null,
        Number(caps || 0),
        Number(goals || 0),
        photo_url || null,
        typeof is_active === "undefined" ? 1 : is_active ? 1 : 0,
        status || "active",
      ],
    );

    const created = await get(`SELECT * FROM players WHERE id = ?`, [
      result.lastID,
    ]);

    // Hilangkan origin_country dari response
    const { origin_country, ...createdClean } = created;

    return res.status(201).json({
      success: true,
      message: "Pemain berhasil ditambahkan",
      data: {
        ...createdClean,
        is_naturalized: Boolean(createdClean.is_naturalized),
        is_active: Boolean(createdClean.is_active),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal menambah pemain",
      error: error.message,
    });
  }
};

exports.getSquadByTournament = async (req, res) => {
  try {
    const { tournament_id } = req.params;

    const tournament = await get(
      "SELECT id, name FROM tournaments WHERE id = ?",
      [tournament_id],
    );
    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    }

    const players = await all(
      `SELECT * FROM players
       WHERE tournament_id = ? AND is_active = 1
       ORDER BY jersey_number ASC`,
      [tournament_id],
    );

    const grouped = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
    };

    players.forEach((player) => {
      // Hilangkan origin_country dari response
      const { origin_country, ...rest } = player;
      grouped[player.position].push({
        ...rest,
        is_naturalized: Boolean(player.is_naturalized),
        is_active: Boolean(player.is_active),
      });
    });

    return res.json({
      success: true,
      tournament: tournament.name,
      head_coach: null,
      total_players: players.length,
      squad: grouped,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil skuad",
      error: error.message,
    });
  }
};
