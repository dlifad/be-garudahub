const express = require("express");
const playerController = require("../controllers/playerController");

const router = express.Router();

router.get("/", playerController.getPlayers);
router.post("/", playerController.createPlayer);
router.get("/squad/:tournament_id", playerController.getSquadByTournament);

module.exports = router;
