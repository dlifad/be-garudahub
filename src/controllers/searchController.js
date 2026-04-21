const db = require("../config/db");

exports.globalSearch = (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res
      .status(400)
      .json({ success: false, message: "Query pencarian wajib diisi" });
  }

  const keyword = `%${q}%`;

  const result = {
    players: [],
    matches: [],
    tournaments: [],
    news: [],
  };

  db.all(
    "SELECT * FROM players WHERE name LIKE ? OR current_club LIKE ? OR position LIKE ?",
    [keyword, keyword, keyword],
    (err, players) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Gagal mencari data", error: err.message });
      result.players = players;

      db.all(
        `SELECT m.*, t.name AS tournament_name
       FROM matches m
       LEFT JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.opponent LIKE ? OR t.name LIKE ? OR m.stadium_name LIKE ?`,
        [keyword, keyword, keyword],
        (err, matches) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "Gagal mencari data", error: err.message });
          result.matches = matches;

          db.all(
            "SELECT * FROM tournaments WHERE name LIKE ? OR season LIKE ? OR description LIKE ?",
            [keyword, keyword, keyword],
            (err, tournaments) => {
              if (err)
                return res
                  .status(500)
                  .json({ success: false, message: "Gagal mencari data", error: err.message });
              result.tournaments = tournaments;

              db.all(
                "SELECT * FROM news WHERE title LIKE ? OR content LIKE ?",
                [keyword, keyword],
                (err, news) => {
                  if (err)
                    return res
                      .status(500)
                      .json({ success: false, message: "Gagal mencari data", error: err.message });
                  result.news = news;

                  res.json({
                    success: true,
                    data: result,
                  });
                },
              );
            },
          );
        },
      );
    },
  );
};
