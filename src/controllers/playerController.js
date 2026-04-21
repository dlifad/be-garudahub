// Assign player to tournament (POST /assign)
exports.assignPlayerToTournament = async (req, res) => {
  try {
    const { tournament_id, player_id, jersey_number, status, is_active } =
      req.body;
    if (!tournament_id || !player_id || jersey_number === undefined) {
      return res.status(400).json({
        success: false,
        message: "Field wajib: tournament_id, player_id, jersey_number",
      });
    }
    // Cek turnamen dan pemain
    const tournament = await get("SELECT id FROM tournaments WHERE id = ?", [
      tournament_id,
    ]);
    if (!tournament)
      return res
        .status(404)
        .json({ success: false, message: "Turnamen tidak ditemukan" });
    const player = await get("SELECT id FROM players WHERE id = ?", [
      player_id,
    ]);
    if (!player)
      return res
        .status(404)
        .json({ success: false, message: "Pemain tidak ditemukan" });
    // Cek duplikat
    const existing = await get(
      "SELECT id FROM tournament_players WHERE tournament_id = ? AND player_id = ?",
      [tournament_id, player_id],
    );
    if (existing)
      return res.status(409).json({
        success: false,
        message: "Pemain sudah terdaftar di turnamen ini",
      });
    // Cek nomor punggung
    const jerseyUsed = await get(
      "SELECT id FROM tournament_players WHERE tournament_id = ? AND jersey_number = ? AND is_active = 1",
      [tournament_id, jersey_number],
    );
    if (jerseyUsed)
      return res.status(409).json({
        success: false,
        message: "Nomor punggung sudah dipakai pemain aktif di turnamen ini",
      });
    await run(
      `INSERT INTO tournament_players (tournament_id, player_id, jersey_number, is_active, status) VALUES (?, ?, ?, ?, ?)`,
      [
        tournament_id,
        player_id,
        jersey_number,
        typeof is_active === "undefined" ? 1 : is_active ? 1 : 0,
        status || "active",
      ],
    );
    return res
      .status(201)
      .json({ success: true, message: "Pemain berhasil diassign ke turnamen" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal assign pemain",
      error: error.message,
    });
  }
};

// Unassign player from tournament (DELETE /assign)
exports.unassignPlayerFromTournament = async (req, res) => {
  try {
    const { tournament_id, player_id } = req.body;
    if (!tournament_id || !player_id) {
      return res.status(400).json({
        success: false,
        message: "Field wajib: tournament_id, player_id",
      });
    }
    const link = await get(
      "SELECT id FROM tournament_players WHERE tournament_id = ? AND player_id = ?",
      [tournament_id, player_id],
    );
    if (!link)
      return res.status(404).json({
        success: false,
        message: "Pemain tidak terdaftar di turnamen ini",
      });
    await run("DELETE FROM tournament_players WHERE id = ?", [link.id]);
    return res.json({
      success: true,
      message: "Pemain berhasil dilepas dari turnamen",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal lepas pemain",
      error: error.message,
    });
  }
};

// Update jersey number (PATCH /assign)
exports.updateJerseyNumber = async (req, res) => {
  try {
    const { tournament_id, player_id, jersey_number } = req.body;
    if (!tournament_id || !player_id || jersey_number === undefined) {
      return res.status(400).json({
        success: false,
        message: "Field wajib: tournament_id, player_id, jersey_number",
      });
    }
    // Cek link
    const link = await get(
      "SELECT id FROM tournament_players WHERE tournament_id = ? AND player_id = ?",
      [tournament_id, player_id],
    );
    if (!link)
      return res.status(404).json({
        success: false,
        message: "Pemain tidak terdaftar di turnamen ini",
      });
    // Cek nomor punggung baru
    const jerseyUsed = await get(
      "SELECT id FROM tournament_players WHERE tournament_id = ? AND jersey_number = ? AND is_active = 1 AND player_id != ?",
      [tournament_id, jersey_number, player_id],
    );
    if (jerseyUsed)
      return res.status(409).json({
        success: false,
        message: "Nomor punggung sudah dipakai pemain aktif di turnamen ini",
      });
    await run("UPDATE tournament_players SET jersey_number = ? WHERE id = ?", [
      jersey_number,
      link.id,
    ]);
    return res.json({
      success: true,
      message: "Nomor punggung berhasil diupdate",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal update nomor punggung",
      error: error.message,
    });
  }
};
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
    const tournamentIdNum =
      typeof tournament_id !== "undefined" ? Number(tournament_id) : null;

    if (
      typeof tournament_id !== "undefined" &&
      (!Number.isInteger(tournamentIdNum) || tournamentIdNum <= 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "tournament_id tidak valid" });
    }

    if (position) {
      where.push(`${tournament_id ? "p" : "players"}.position = ?`);
      params.push(position);
    }

    if (tournament_id) {
      where.push("tp.tournament_id = ?");
      params.push(tournamentIdNum);
    }

    if (typeof isActive !== "undefined") {
      const parsed = toBool(isActive);
      if (parsed === null) {
        return res
          .status(400)
          .json({ success: false, message: "is_active harus true/false" });
      }
      where.push(`${tournament_id ? "tp" : "players"}.is_active = ?`);
      params.push(parsed);
    }

    if (club) {
      if (tournament_id) {
        where.push("(p.current_club LIKE ? OR p.club LIKE ?)");
      } else {
        where.push("(players.current_club LIKE ? OR players.club LIKE ?)");
      }
      params.push(`%${club}%`, `%${club}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const rows = tournament_id
      ? await all(
          `SELECT p.*, tp.tournament_id, tp.jersey_number,
                  tp.status AS squad_status, tp.is_active AS squad_is_active
           FROM tournament_players tp
           JOIN players p ON p.id = tp.player_id
           ${whereClause}
           ORDER BY tp.jersey_number ASC`,
          params,
        )
      : await all(
          `SELECT * FROM players
           ${whereClause}
           ORDER BY name ASC`,
          params,
        );

    return res.json({
      success: true,
      data: rows.map((row) => {
        const resolvedActive =
          typeof row.squad_is_active === "undefined"
            ? Boolean(row.is_active)
            : Boolean(row.squad_is_active);

        return {
          ...row,
          status: row.squad_status || row.status,
          is_naturalized: Boolean(row.is_naturalized),
          is_active: resolvedActive,
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

    if (!name || !position) {
      return res.status(400).json({
        success: false,
        message: "Field wajib: name, position",
      });
    }

    if (!ALLOWED_POSITIONS.has(position)) {
      return res
        .status(400)
        .json({ success: false, message: "position tidak valid" });
    }

    const tournamentIdNum =
      typeof tournament_id !== "undefined" ? Number(tournament_id) : null;

    if (
      typeof tournament_id !== "undefined" &&
      (!Number.isInteger(tournamentIdNum) || tournamentIdNum <= 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "tournament_id tidak valid" });
    }

    const existingPlayer = await get(
      "SELECT id FROM players WHERE LOWER(name) = LOWER(?)",
      [name.trim()],
    );

    if (existingPlayer && !tournament_id) {
      return res
        .status(409)
        .json({ success: false, message: "Nama pemain sudah ada" });
    }

    let playerId = existingPlayer ? existingPlayer.id : null;

    if (!existingPlayer) {
      const result = await run(
        `INSERT INTO players
         (name, nickname, position, date_of_birth, nationality,
          is_naturalized, current_club, club, club_country, caps, goals, photo_url,
          is_active, status)
         VALUES (?, ?, ?, ?, 'Indonesia', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          nickname || null,
          position,
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
      playerId = result.lastID;
    }

    if (tournament_id) {
      if (jersey_number === undefined) {
        return res.status(400).json({
          success: false,
          message: "Jika pakai tournament_id, field jersey_number wajib diisi",
        });
      }

      const tournament = await get("SELECT id FROM tournaments WHERE id = ?", [
        tournamentIdNum,
      ]);
      if (!tournament) {
        return res
          .status(404)
          .json({ success: false, message: "Turnamen tidak ditemukan" });
      }

      const existingLink = await get(
        "SELECT id FROM tournament_players WHERE tournament_id = ? AND player_id = ?",
        [tournamentIdNum, playerId],
      );
      if (existingLink) {
        return res.status(409).json({
          success: false,
          message: "Pemain sudah terdaftar di turnamen ini",
        });
      }

      const existingJersey = await get(
        "SELECT id FROM tournament_players WHERE tournament_id = ? AND jersey_number = ? AND is_active = 1",
        [tournamentIdNum, Number(jersey_number)],
      );
      if (existingJersey) {
        return res.status(409).json({
          success: false,
          message: "Nomor punggung sudah dipakai pemain aktif di turnamen ini",
        });
      }

      await run(
        `INSERT INTO tournament_players
         (tournament_id, player_id, jersey_number, is_active, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          tournamentIdNum,
          playerId,
          Number(jersey_number),
          typeof is_active === "undefined" ? 1 : is_active ? 1 : 0,
          status || "active",
        ],
      );
    }

    const created = await get(`SELECT * FROM players WHERE id = ?`, [playerId]);

    const squadAssignment = tournament_id
      ? await get(
          `SELECT tournament_id, jersey_number, status, is_active
           FROM tournament_players
           WHERE tournament_id = ? AND player_id = ?`,
          [tournamentIdNum, playerId],
        )
      : null;

    return res.status(201).json({
      success: true,
      message: "Pemain berhasil ditambahkan",
      player_already_existed: Boolean(existingPlayer),
      data: {
        ...created,
        tournament_assignment: squadAssignment
          ? {
              ...squadAssignment,
              is_active: Boolean(squadAssignment.is_active),
            }
          : null,
        is_naturalized: Boolean(created.is_naturalized),
        is_active: Boolean(created.is_active),
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

    const coaches = await all(
      `SELECT id, name, role, start_date, end_date, is_active
       FROM tournament_coaches
       WHERE tournament_id = ? AND role = 'head_coach'
       ORDER BY COALESCE(start_date, '0000-01-01') DESC, id DESC`,
      [tournament_id],
    );

    const headCoach =
      coaches.find((coach) => coach.is_active === 1) || coaches[0];

    const players = await all(
      `SELECT p.*, tp.jersey_number,
              tp.status AS squad_status,
              tp.is_active AS squad_is_active
       FROM tournament_players tp
       JOIN players p ON p.id = tp.player_id
       WHERE tp.tournament_id = ? AND tp.is_active = 1
       ORDER BY tp.jersey_number ASC`,
      [tournament_id],
    );

    const grouped = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
    };

    players.forEach((player) => {
      grouped[player.position].push({
        ...player,
        status: player.squad_status || player.status,
        is_naturalized: Boolean(player.is_naturalized),
        is_active: Boolean(player.squad_is_active),
      });
    });

    return res.json({
      success: true,
      tournament: tournament.name,
      head_coach: headCoach ? headCoach.name : null,
      coach_history: coaches.map((coach) => ({
        ...coach,
        is_active: Boolean(coach.is_active),
      })),
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
