const express = require("express");
const currencyController = require("../controllers/currencyController");

const router = express.Router();

router.get("/ticket-price", currencyController.convertTicketPrice);

module.exports = router;
