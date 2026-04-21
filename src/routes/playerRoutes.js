const express = require("express");
const playerController = require("../controllers/playerController");

const router = express.Router();

// Assign/unassign/update jersey endpoints
router.post("/assign", playerController.assignPlayerToTournament);
router.delete("/assign", playerController.unassignPlayerFromTournament);
router.patch("/assign", playerController.updateJerseyNumber);

router.get("/", playerController.getPlayers);
router.post("/", playerController.createPlayer);
router.get("/squad/:tournament_id", playerController.getSquadByTournament);

module.exports = router;
