const express = require("express");
const tournamentController = require("../controllers/tournamentController");

const router = express.Router();

router.get("/", tournamentController.getTournaments);
router.get("/:id", tournamentController.getTournamentById);
router.post("/", tournamentController.createTournament);
router.patch("/:id", tournamentController.updateTournament);
router.get(
  "/:tournament_id/coaches",
  tournamentController.getTournamentCoaches,
);
router.post("/:tournament_id/coaches", tournamentController.addTournamentCoach);

module.exports = router;
