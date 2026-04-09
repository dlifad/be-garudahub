const express = require('express');
const router = express.Router();
const merchandiseController = require('../controllers/merchandiseController');

router.get('/', merchandiseController.getAllMerchandise);
router.get('/:id', merchandiseController.getMerchandiseById);

module.exports = router;