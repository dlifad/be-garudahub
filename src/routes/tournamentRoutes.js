const express = require("express");
const tournamentController = require("../controllers/tournamentController");

const router = express.Router();

router.get("/", tournamentController.getTournaments);
router.post("/", tournamentController.createTournament);

module.exports = router;
