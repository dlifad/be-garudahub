const express = require("express");
const predictionController = require("../controllers/predictionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, predictionController.submitPrediction);
router.post("/calculate-points", predictionController.calculatePoints);
router.get("/leaderboard", predictionController.getLeaderboard);

module.exports = router;
