const express = require("express");
const playerController = require("../controllers/playerController");

const router = express.Router();

// Assign/unassign squad membership endpoints
router.post("/assign", playerController.assignPlayerToTournament);
router.delete("/assign", playerController.unassignPlayerFromTournament);

router.get("/", playerController.getPlayers);
router.post("/", playerController.createPlayer);
router.get("/squad/:tournament_id", playerController.getSquadByTournament);

module.exports = router;
