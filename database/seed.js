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
      "stadium_name",
      "status",
      "home_score",
      "away_score",
      "ticket_price_idr",
    ],
  },
  {
    table: "players",
    file: "./data/players.json",
    columns: [
      "tournament_id",
      "name",
      "nickname",
      "position",
      "jersey_number",
      "date_of_birth",
      "nationality",
      "is_naturalized",
      "current_club",
      "club",
      "club_country",
      "caps",
      "goals",
      "photo_url",
      "is_active",
      "status",
    ],
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
