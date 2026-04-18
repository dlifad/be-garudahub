const { all, get, run } = require("../utils/dbAsync");

function getResultType(indonesiaScore, opponentScore) {
  if (indonesiaScore > opponentScore) {
    return "WIN";
  }
  if (indonesiaScore < opponentScore) {
    return "LOSS";
  }
  return "DRAW";
}

function calculatePoints(
  actualIndonesia,
  actualOpponent,
  predictedIndonesia,
  predictedOpponent,
) {
  let points = 0;

  const actualDiff = actualIndonesia - actualOpponent;
  const predictedDiff = predictedIndonesia - predictedOpponent;

  if (
    actualIndonesia === predictedIndonesia &&
    actualOpponent === predictedOpponent
  ) {
    points = 10;
  } else if (
    getResultType(actualIndonesia, actualOpponent) ===
      getResultType(predictedIndonesia, predictedOpponent) &&
    actualDiff === predictedDiff
  ) {
    points = 7;
  } else if (
    getResultType(actualIndonesia, actualOpponent) ===
    getResultType(predictedIndonesia, predictedOpponent)
  ) {
    points = 5;
  }

  if (actualOpponent === 0 && predictedOpponent === 0) {
    points += 2;
  }

  if (actualIndonesia >= 3 && predictedIndonesia >= 3) {
    points += 2;
  }

  return points;
}

exports.submitPrediction = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { match_id, predicted_indonesia_score, predicted_opponent_score } =
      req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!match_id && match_id !== 0) {
      return res
        .status(400)
        .json({ success: false, message: "match_id wajib diisi" });
    }

    const predictedIndonesia = Number(predicted_indonesia_score);
    const predictedOpponent = Number(predicted_opponent_score);

    if (
      Number.isNaN(predictedIndonesia) ||
      Number.isNaN(predictedOpponent) ||
      predictedIndonesia < 0 ||
      predictedOpponent < 0 ||
      predictedIndonesia > 20 ||
      predictedOpponent > 20
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Skor prediksi tidak valid" });
    }

    const match = await get(
      `SELECT m.*, t.name AS tournament_name
       FROM matches m
       JOIN tournaments t ON t.id = m.tournament_id
       WHERE m.id = ?`,
      [match_id],
    );

    if (
      !match ||
      (match.home_team !== "Indonesia" && match.away_team !== "Indonesia")
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    if (match.status === "ongoing" || match.status === "finished") {
      return res.status(400).json({
        success: false,
        message:
          "Prediksi sudah ditutup, pertandingan sedang/sudah berlangsung",
      });
    }

    const kickoffTime = new Date(match.match_date_utc).getTime();
    const deadline = kickoffTime - 30 * 60 * 1000;

    if (Date.now() >= deadline) {
      return res.status(400).json({
        success: false,
        message: "Prediksi ditutup 30 menit sebelum pertandingan",
      });
    }

    const existing = await get(
      "SELECT id FROM predictions WHERE user_id = ? AND match_id = ?",
      [userId, match_id],
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Kamu sudah mengirim prediksi untuk pertandingan ini",
      });
    }

    const inserted = await run(
      `INSERT INTO predictions
       (user_id, match_id, predicted_indonesia_score, predicted_opponent_score)
       VALUES (?, ?, ?, ?)`,
      [userId, match_id, predictedIndonesia, predictedOpponent],
    );

    const created = await get(
      `SELECT id, user_id, match_id, predicted_indonesia_score, predicted_opponent_score,
              points_earned, created_at
       FROM predictions
       WHERE id = ?`,
      [inserted.lastID],
    );

    const summary = `Indonesia ${predictedIndonesia > predictedOpponent ? "Menang" : predictedIndonesia < predictedOpponent ? "Kalah" : "Imbang"} ${predictedIndonesia}-${predictedOpponent}`;

    return res.status(201).json({
      success: true,
      message: "Prediksi kamu tersimpan!",
      data: {
        ...created,
        match_info: `${match.home_team} vs ${match.away_team} - ${match.tournament_name}`,
        prediction_summary: summary,
        submitted_at: created.created_at,
        deadline: new Date(deadline).toISOString(),
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengirim prediksi",
        error: error.message,
      });
  }
};

exports.calculatePoints = async (req, res) => {
  try {
    const { match_id } = req.body;

    if (!match_id && match_id !== 0) {
      return res
        .status(400)
        .json({ success: false, message: "match_id wajib diisi" });
    }

    const match = await get("SELECT * FROM matches WHERE id = ?", [match_id]);

    if (!match) {
      return res
        .status(404)
        .json({ success: false, message: "Pertandingan tidak ditemukan" });
    }

    if (
      match.status !== "finished" ||
      match.home_score === null ||
      match.away_score === null
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Poin hanya bisa dihitung untuk pertandingan selesai",
        });
    }

    const actualIndonesia = match.is_home ? match.home_score : match.away_score;
    const actualOpponent = match.is_home ? match.away_score : match.home_score;

    const predictions = await all(
      `SELECT id, predicted_indonesia_score, predicted_opponent_score
       FROM predictions
       WHERE match_id = ?`,
      [match_id],
    );

    for (const prediction of predictions) {
      const points = calculatePoints(
        actualIndonesia,
        actualOpponent,
        prediction.predicted_indonesia_score,
        prediction.predicted_opponent_score,
      );

      await run("UPDATE predictions SET points_earned = ? WHERE id = ?", [
        points,
        prediction.id,
      ]);
    }

    return res.json({
      success: true,
      message: "Kalkulasi poin selesai",
      data: {
        match_id: Number(match_id),
        processed_predictions: predictions.length,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal menghitung poin",
        error: error.message,
      });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const rows = await all(
      `SELECT
          u.id AS user_id,
          u.name AS username,
          COALESCE(SUM(p.points_earned), 0) AS total_points,
          COUNT(p.id) AS total_predictions,
          SUM(CASE
                WHEN p.points_earned IN (5, 7, 9, 10, 12, 14)
                THEN 1
                ELSE 0
              END) AS correct_results,
          SUM(CASE
                WHEN p.points_earned IN (10, 12, 14)
                THEN 1
                ELSE 0
              END) AS exact_scores
       FROM users u
       LEFT JOIN predictions p ON p.user_id = u.id
       GROUP BY u.id, u.name
       ORDER BY total_points DESC, exact_scores DESC, correct_results DESC, u.id ASC`,
    );

    const data = rows.map((row, index) => ({
      rank: index + 1,
      user_id: row.user_id,
      username: row.username,
      total_points: row.total_points,
      total_predictions: row.total_predictions,
      correct_results: row.correct_results || 0,
      exact_scores: row.exact_scores || 0,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil leaderboard",
        error: error.message,
      });
  }
};
