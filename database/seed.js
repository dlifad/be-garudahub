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

const ensureMatchesFormationColumn = (onDone) => {
  db.all("PRAGMA table_info(matches)", [], (err, columns) => {
    if (err) {
      console.error("Gagal cek skema matches:", err.message);
      onDone();
      return;
    }

    const hasFormation = columns.some((column) => column.name === "formation");

    if (hasFormation) {
      onDone();
      return;
    }

    db.run(
      "ALTER TABLE matches ADD COLUMN formation TEXT",
      (alterErr) => {
        if (alterErr) {
          console.error(
            "Gagal tambah kolom formation ke matches:",
            alterErr.message,
          );
        }
        onDone();
      },
    );
  });
};

const ensureMatchLineupsSchema = (onDone) => {
  db.get(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'match_lineups'",
    [],
    (err, row) => {
      if (err) {
        console.error("Gagal baca schema match_lineups:", err.message);
        onDone();
        return;
      }

      const sql = String((row && row.sql) || "").toUpperCase();
      const hasIsCaptain = sql.includes("IS_CAPTAIN");
      const hasDetailedPositions = sql.includes("'LCB'") && sql.includes("'RWB'");
      const hasIsActive = sql.includes("IS_ACTIVE");

      if (hasIsCaptain && hasDetailedPositions && !hasIsActive) {
        onDone();
        return;
      }

      db.serialize(() => {
        db.run("PRAGMA foreign_keys = OFF");
        db.run("BEGIN TRANSACTION");
        db.run("ALTER TABLE match_lineups RENAME TO match_lineups_old", (renameErr) => {
          if (renameErr) {
            console.error("Gagal rename match_lineups:", renameErr.message);
            db.run("ROLLBACK");
            db.run("PRAGMA foreign_keys = ON");
            onDone();
            return;
          }

          db.run(
            `CREATE TABLE match_lineups (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              match_id INTEGER NOT NULL,
              player_id INTEGER NOT NULL,
              tournament_id INTEGER NOT NULL,
              is_starting_eleven INTEGER DEFAULT 1,
              is_captain INTEGER DEFAULT 0,
              jersey_number INTEGER,
              position TEXT CHECK(position IN ('GK', 'DEF', 'MID', 'FWD', 'CB', 'LCB', 'RCB', 'RB', 'LB', 'RWB', 'LWB', 'CM', 'CDM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST')),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (match_id) REFERENCES matches(id),
              FOREIGN KEY (player_id) REFERENCES players(id),
              FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
              UNIQUE(match_id, player_id)
            )`,
            (createErr) => {
              if (createErr) {
                console.error("Gagal create match_lineups baru:", createErr.message);
                db.run("ROLLBACK");
                db.run("PRAGMA foreign_keys = ON");
                onDone();
                return;
              }

              db.run(
                `INSERT INTO match_lineups
                 (id, match_id, player_id, tournament_id, is_starting_eleven, is_captain, jersey_number, position, created_at)
                 SELECT
                   id,
                   match_id,
                   player_id,
                   tournament_id,
                   is_starting_eleven,
                   COALESCE(is_captain, 0),
                   jersey_number,
                   CASE
                     WHEN position IS NULL THEN NULL
                     ELSE UPPER(position)
                   END,
                   created_at
                 FROM match_lineups_old`,
                (copyErr) => {
                  if (copyErr) {
                    console.error("Gagal copy data match_lineups:", copyErr.message);
                    db.run("ROLLBACK");
                    db.run("PRAGMA foreign_keys = ON");
                    onDone();
                    return;
                  }

                  db.run("DROP TABLE match_lineups_old");
                  db.run(
                    "CREATE INDEX IF NOT EXISTS idx_match_lineups_match ON match_lineups(match_id)",
                  );
                  db.run(
                    "CREATE INDEX IF NOT EXISTS idx_match_lineups_player ON match_lineups(player_id)",
                  );
                  db.run("COMMIT", (commitErr) => {
                    if (commitErr) {
                      console.error(
                        "Gagal commit migrasi match_lineups:",
                        commitErr.message,
                      );
                      db.run("ROLLBACK");
                    }
                    db.run("PRAGMA foreign_keys = ON");
                    onDone();
                  });
                },
              );
            },
          );
        });
      });
    },
  );
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
      "formation",
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
    table: "match_lineups",
    file: "./data/match_lineups.json",
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
  ensureMatchesFormationColumn(() => {
    ensureMatchLineupsSchema(() => {
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
                tournament_id, matchday, round, formation, is_home,
                home_team, away_team, opponent,
                opponent_flag, home_team_flag, away_team_flag,
                match_date_utc,
                venue_id,
                status, home_score, away_score,
                home_goals, away_goals,
                ticket_cat1, ticket_cat2, ticket_cat3, ticket_VIP
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(tournament_id, match_date_utc) DO UPDATE SET
                matchday = excluded.matchday,
                round = excluded.round,
                formation = excluded.formation,
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
                item.formation || null,
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

      if (config.table === "match_lineups") {
        const upsertMatchLineup = ({
          matchId,
          playerId,
          tournamentId,
          isStartingEleven,
          isCaptain,
          jerseyNumber,
          position,
          sourceLabel,
        }) => {
          db.run(
            `INSERT INTO match_lineups
             (match_id, player_id, tournament_id, is_starting_eleven, is_captain, jersey_number, position)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(match_id, player_id) DO UPDATE SET
               tournament_id = excluded.tournament_id,
               is_starting_eleven = excluded.is_starting_eleven,
               is_captain = excluded.is_captain,
               jersey_number = excluded.jersey_number,
               position = excluded.position`,
            [
              matchId,
              playerId,
              tournamentId,
              isStartingEleven,
              isCaptain,
              jerseyNumber,
              position,
            ],
            (lineupErr) => {
              if (lineupErr) {
                console.error(
                  `Gagal upsert match_lineups (${sourceLabel}):`,
                  lineupErr.message,
                );
              }
            },
          );
        };

        data.forEach((item) => {
          const onResolvedPlayer = (playerId) => {
            const onResolvedMatch = (matchId) => {
              const tournamentId = item.tournament_id ?? item.match_tournament_id;
              const isStartingEleven = Number(
                item.is_starting_eleven !== undefined
                  ? item.is_starting_eleven
                  : item.is_starting || 0,
              );
              const isCaptain = Number(
                item.is_captain !== undefined
                  ? item.is_captain
                  : item.captain || 0,
              );
              const normalizedPosition = item.position
                ? String(item.position).toUpperCase()
                : null;

              upsertMatchLineup({
                matchId,
                playerId,
                tournamentId,
                isStartingEleven,
                isCaptain,
                jerseyNumber: item.jersey_number ?? null,
                position: normalizedPosition,
                sourceLabel: item.player_code || item.player_id || item.player_name,
              });
            };

            if (item.match_id) {
              onResolvedMatch(item.match_id);
              return;
            }

            if (!item.match_tournament_id || !item.match_date_utc) {
              console.error(
                "Data match_lineups butuh match_id ATAU kombinasi match_tournament_id + match_date_utc.",
              );
              return;
            }

            db.get(
              `SELECT id
               FROM matches
               WHERE tournament_id = ? AND match_date_utc = ?`,
              [item.match_tournament_id, item.match_date_utc],
              (findMatchErr, rowMatch) => {
                if (findMatchErr) {
                  console.error(
                    `Gagal cari match ${item.match_tournament_id} @ ${item.match_date_utc}:`,
                    findMatchErr.message,
                  );
                  return;
                }

                if (!rowMatch) {
                  console.error(
                    `Match tidak ditemukan untuk tournament_id ${item.match_tournament_id} pada ${item.match_date_utc}`,
                  );
                  return;
                }

                onResolvedMatch(rowMatch.id);
              },
            );
          };

          if (item.player_id) {
            onResolvedPlayer(item.player_id);
            return;
          }

          if (item.player_code) {
            db.get(
              "SELECT id FROM players WHERE player_code = ?",
              [item.player_code],
              (findErr, rowPlayer) => {
                if (findErr) {
                  console.error(
                    `Gagal cari player_id dari player_code ${item.player_code}:`,
                    findErr.message,
                  );
                  return;
                }

                if (!rowPlayer) {
                  console.error(
                    `Player dengan player_code ${item.player_code} tidak ditemukan.`,
                  );
                  return;
                }

                onResolvedPlayer(rowPlayer.id);
              },
            );
            return;
          }

          if (item.player_name) {
            db.get(
              "SELECT id FROM players WHERE LOWER(name) = LOWER(?)",
              [item.player_name],
              (findErr, rowPlayer) => {
                if (findErr) {
                  console.error(
                    `Gagal cari player_id dari player_name ${item.player_name}:`,
                    findErr.message,
                  );
                  return;
                }

                if (!rowPlayer) {
                  console.error(
                    `Player dengan nama ${item.player_name} tidak ditemukan.`,
                  );
                  return;
                }

                onResolvedPlayer(rowPlayer.id);
              },
            );
            return;
          }

          console.error(
            "Data match_lineups harus punya player_code, player_id, atau player_name.",
          );
        });

        console.log(
          "Seeder match_lineups selesai (mode upsert: player_code/match_key didukung).",
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
  });
});
