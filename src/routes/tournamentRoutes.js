const express = require("express");
const tournamentController = require("../controllers/tournamentController");

const router = express.Router();

router.get("/", tournamentController.getTournaments);
router.post("/", tournamentController.createTournament);
router.get(
  "/:tournament_id/coaches",
  tournamentController.getTournamentCoaches,
);
router.post("/:tournament_id/coaches", tournamentController.addTournamentCoach);

module.exports = router;
