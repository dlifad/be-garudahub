const db = require("../src/config/db");

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
      "venue",
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

db.serialize(() => {
  seedConfig.forEach((config) => {
    const data = require(config.file);

    if (config.table === "players") {
      data.forEach((item) => {
        db.run(
          `INSERT INTO players
           (name, nickname, position, date_of_birth, nationality,
            is_naturalized, current_club, club, club_country, caps, goals,
            photo_url, is_active, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(name) DO UPDATE SET
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
      console.log("Seeder players selesai (mode upsert).");

      return;
    }

    if (config.table === "tournament_players") {
      data.forEach((item) => {
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

            db.run(
              `INSERT INTO tournament_players
               (tournament_id, player_id, jersey_number, is_active, status)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(tournament_id, player_id) DO UPDATE SET
                 jersey_number = excluded.jersey_number,
                 is_active = excluded.is_active,
                 status = excluded.status`,
              [
                item.tournament_id,
                rowPlayer.id,
                item.jersey_number,
                item.is_active,
                item.status,
              ],
              (squadErr) => {
                if (squadErr) {
                  console.error(
                    `Gagal upsert relasi pemain ${item.player_name} ke turnamen ${item.tournament_id}:`,
                    squadErr.message,
                  );
                }
              },
            );
          },
        );
      });
      console.log("Seeder tournament_players selesai (mode upsert).");

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
