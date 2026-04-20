const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, upload.single('profile_photo'), profileController.updateProfile);

module.exports = router;