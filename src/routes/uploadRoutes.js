const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/upload/image
// citizens can upload images
router.post('/image', authenticateToken, upload.single('image'), uploadController.uploadImage);

module.exports = router;
