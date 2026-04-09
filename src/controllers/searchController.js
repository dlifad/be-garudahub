const db = require('../config/db');

exports.globalSearch = (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ message: 'Query pencarian wajib diisi' });
  }

  const keyword = `%${q}%`;

  const result = {
    players: [],
    matches: [],
    tournaments: [],
    news: [],
  };

  db.all('SELECT * FROM players WHERE name LIKE ? OR club LIKE ? OR position LIKE ?', [keyword, keyword, keyword], (err, players) => {
    if (err) return res.status(500).json({ message: err.message });
    result.players = players;

    db.all('SELECT * FROM matches WHERE opponent LIKE ? OR tournament_name LIKE ? OR stadium_name LIKE ?', [keyword, keyword, keyword], (err, matches) => {
      if (err) return res.status(500).json({ message: err.message });
      result.matches = matches;

      db.all('SELECT * FROM tournaments WHERE name LIKE ? OR season LIKE ? OR description LIKE ?', [keyword, keyword, keyword], (err, tournaments) => {
        if (err) return res.status(500).json({ message: err.message });
        result.tournaments = tournaments;

        db.all('SELECT * FROM news WHERE title LIKE ? OR content LIKE ?', [keyword, keyword], (err, news) => {
          if (err) return res.status(500).json({ message: err.message });
          result.news = news;

          res.json(result);
        });
      });
    });
  });
};