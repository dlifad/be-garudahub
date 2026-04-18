const express = require("express");
const matchController = require("../controllers/matchController");

const router = express.Router();

router.get("/", matchController.getMatches);
router.post("/", matchController.createMatch);
router.put("/:id", matchController.updateMatch);
router.get("/:id/schedule-local", matchController.getLocalSchedule);

module.exports = router;
