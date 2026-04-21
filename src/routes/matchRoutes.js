const express = require("express");
const matchController = require("../controllers/matchController");

const router = express.Router();

router.get("/", matchController.getMatches);
router.get("/:id", matchController.getMatchById);
router.post("/", matchController.createMatch);
router.put("/:id", matchController.updateMatch);
router.get("/:id/schedule-local", matchController.getLocalSchedule);
router.post("/:id/lineup", matchController.setMatchLineup);
router.get("/:id/lineup", matchController.getMatchLineup);
router.delete("/:id/lineup/:player_id", matchController.deleteMatchLineup);

module.exports = router;
