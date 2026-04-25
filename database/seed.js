const db = require("../src/config/db");

const toPlayerCode = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const ensurePlayersPlayerCodeColumn = (onDone) => {
  db.all("PRAGMA table_info(players)", [], (err, columns) => {
    if (err) {
      console.error("Gagal cek skema players:", err.message);
      onDone();
      return;
    }

    const hasPlayerCode = columns.some((column) => column.name === "player_code");

    const ensureIndex = () => {
      db.run(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_players_code_unique ON players(player_code)",
        (indexErr) => {
          if (indexErr) {
            console.error("Gagal buat index player_code:", indexErr.message);
          }
          onDone();
        },
      );
    };

    if (hasPlayerCode) {
      ensureIndex();
      return;
    }

    db.run("ALTER TABLE players ADD COLUMN player_code TEXT", (alterErr) => {
      if (alterErr) {
        console.error(
          "Gagal tambah kolom player_code ke players:",
          alterErr.message,
        );
      }
      ensureIndex();
    });
  });
};

// mapping tabel ke file JSON
const seedConfig = [
  {
    table: "tournaments",
    file: "./data/tournaments.json",
    columns: [
      "name",
      "type",
      "confederation",
      "stage",
      "indonesia_group",
      "start_date",
      "end_date",
      "host_country",
      "logo_url",
      "season",
      "description",
    ],
  },
  {
    table: "venues",
    file: "./data/venues.json",
    columns: ["name", "city", "country", "latitude", "longitude"],
  },
  {
    table: "matches",
    file: "./data/matches.json",
    columns: [
      "tournament_id",
      "matchday",
      "round",
      "is_home",
      "home_team",
      "away_team",
      "opponent",
      "opponent_flag",
      "home_team_flag",
      "away_team_flag",
      "match_date_utc",
      "venue_name",
      "status",
      "home_score",
      "away_score",
      "home_goals",
      "away_goals",
      "ticket_cat1",
      "ticket_cat2",
      "ticket_cat3",
      "ticket_VIP",
    ],
  },
  {
    table: "players",
    file: "./data/players.json",
    columns: [],
  },
  {
    table: "tournament_players",
    file: "./data/tournament_players.json",
    columns: [],
  },
  {
    table: "merchandise",
    file: "./data/merchandise.json",
    columns: [
      "name",
      "description",
      "price",
      "sizes",
      "shopee_url",
      "image_url",
    ],
  },
  {
    table: "news",
    file: "./data/news.json",
    columns: ["title", "content", "image_url"],
  },
];

ensurePlayersPlayerCodeColumn(() => {
  db.serialize(() => {
    seedConfig.forEach((config) => {
      const data = require(config.file);

    if (config.table === "matches") {
      data.forEach((item) => {
        db.get(
          "SELECT id FROM venues WHERE name = ?",
          [item.venue_name],
          (err, venue) => {
            const venueId = venue ? venue.id : null;

            db.run(
              `INSERT INTO matches (
                tournament_id, matchday, round, is_home,
                home_team, away_team, opponent,
                opponent_flag, home_team_flag, away_team_flag,
                match_date_utc,
                venue_id,
                status, home_score, away_score,
                home_goals, away_goals,
                ticket_cat1, ticket_cat2, ticket_cat3, ticket_VIP
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(tournament_id, match_date_utc) DO UPDATE SET
                matchday = excluded.matchday,
                round = excluded.round,
                is_home = excluded.is_home,
                home_team = excluded.home_team,
                away_team = excluded.away_team,
                opponent = excluded.opponent,
                opponent_flag = excluded.opponent_flag,
                home_team_flag = excluded.home_team_flag,
                away_team_flag = excluded.away_team_flag,
                venue_id = excluded.venue_id,
                status = excluded.status,
                home_score = excluded.home_score,
                away_score = excluded.away_score,
                home_goals = excluded.home_goals,
                away_goals = excluded.away_goals,
                ticket_cat1 = excluded.ticket_cat1,
                ticket_cat2 = excluded.ticket_cat2,
                ticket_cat3 = excluded.ticket_cat3,
                ticket_VIP = excluded.ticket_VIP`,
              [
                item.tournament_id,
                item.matchday,
                item.round,
                item.is_home,
                item.home_team,
                item.away_team,
                item.opponent,
                item.opponent_flag,
                item.home_team_flag,
                item.away_team_flag,
                item.match_date_utc,
                venueId,
                item.status,
                item.home_score,
                item.away_score,
                item.home_goals,
                item.away_goals,
                item.ticket_cat1,
                item.ticket_cat2,
                item.ticket_cat3,
                item.ticket_VIP,
              ],
            );
          },
        );
      });

      console.log("Seeder matches selesai (with venue mapping).");
      return;
    }

      if (config.table === "players") {
        data.forEach((item) => {
          const playerCode = item.player_code || toPlayerCode(item.name);

          db.run(
            `INSERT INTO players
             (player_code, name, nickname, position, date_of_birth, nationality,
              is_naturalized, current_club, club, club_country, caps, goals,
              photo_url, is_active, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(name) DO UPDATE SET
               player_code = excluded.player_code,
               nickname = excluded.nickname,
               position = excluded.position,
               date_of_birth = excluded.date_of_birth,
               nationality = excluded.nationality,
               is_naturalized = excluded.is_naturalized,
               current_club = excluded.current_club,
               club = excluded.club,
               club_country = excluded.club_country,
               caps = excluded.caps,
               goals = excluded.goals,
               photo_url = excluded.photo_url,
               is_active = excluded.is_active,
               status = excluded.status`,
            [
              playerCode,
              item.name,
              item.nickname,
              item.position,
              item.date_of_birth,
              item.nationality,
              item.is_naturalized,
              item.club || item.current_club || null,
              item.club || item.current_club || null,
              item.club_country,
              item.caps,
              item.goals,
              item.photo_url,
              item.is_active,
              item.status,
            ],
            (insertErr) => {
              if (insertErr) {
                console.error(
                  `Gagal upsert pemain ${item.name}:`,
                  insertErr.message,
                );
              }
            },
          );
        });
        console.log("Seeder players selesai (mode upsert + player_code).");

        return;
      }

      if (config.table === "tournament_players") {
        const upsertTournamentPlayer = (
          tournamentId,
          playerId,
          label,
          sourceValue,
        ) => {
          db.run(
            `INSERT INTO tournament_players
             (tournament_id, player_id)
             VALUES (?, ?)
             ON CONFLICT(tournament_id, player_id) DO UPDATE SET
               player_id = excluded.player_id`,
            [tournamentId, playerId],
            (squadErr) => {
              if (squadErr) {
                console.error(
                  `Gagal upsert relasi pemain ${label} ${sourceValue} ke turnamen ${tournamentId}:`,
                  squadErr.message,
                );
              }
            },
          );
        };

        data.forEach((item) => {
          if (item.player_code) {
            db.get(
              "SELECT id FROM players WHERE player_code = ?",
              [item.player_code],
              (findErr, rowPlayer) => {
                if (findErr) {
                  console.error(
                    `Gagal cari id pemain dari player_code ${item.player_code}:`,
                    findErr.message,
                  );
                  return;
                }

                if (!rowPlayer) {
                  console.error(
                    `Player dengan player_code ${item.player_code} tidak ditemukan untuk relasi turnamen ${item.tournament_id}`,
                  );
                  return;
                }

                upsertTournamentPlayer(
                  item.tournament_id,
                  rowPlayer.id,
                  "player_code",
                  item.player_code,
                );
              },
            );
            return;
          }

          if (item.player_id) {
            upsertTournamentPlayer(
              item.tournament_id,
              item.player_id,
              "id",
              item.player_id,
            );
            return;
          }

          if (!item.player_name) {
            console.error(
              `Relasi turnamen ${item.tournament_id} tidak punya player_code/player_id/player_name`,
            );
            return;
          }

          db.get(
            "SELECT id FROM players WHERE LOWER(name) = LOWER(?)",
            [item.player_name],
            (findErr, rowPlayer) => {
              if (findErr) {
                console.error(
                  `Gagal cari id pemain ${item.player_name}:`,
                  findErr.message,
                );
                return;
              }

              if (!rowPlayer) {
                console.error(
                  `Player ${item.player_name} tidak ditemukan untuk relasi turnamen ${item.tournament_id}`,
                );
                return;
              }

              upsertTournamentPlayer(
                item.tournament_id,
                rowPlayer.id,
                "nama",
                item.player_name,
              );
            },
          );
        });
        console.log(
          "Seeder tournament_players selesai (mode upsert: player_code -> player_id -> player_name).",
        );

        return;
      }

      db.get(`SELECT COUNT(*) as count FROM ${config.table}`, [], (err, row) => {
        if (err) return console.error(err.message);

        if (row.count > 0) {
          console.log(`${config.table} sudah ada, skip.`);
          return;
        }

        const placeholders = config.columns.map(() => "?").join(", ");
        const columnNames = config.columns.join(", ");

        const stmt = db.prepare(`
          INSERT INTO ${config.table} (${columnNames})
          VALUES (${placeholders})
        `);

        data.forEach((item) => {
          const values = config.columns.map((col) => item[col]);
          stmt.run(values);
        });

        stmt.finalize();
        console.log(`Seeder ${config.table} selesai.`);
      });
    });
  });
});
