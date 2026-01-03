const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// Register route (POST /auth/signup)
router.post('/signup', validateSignup, authController.signup);

// Login route (POST /auth/login)
router.post('/login', validateLogin, authController.login);

// Get current user route (GET /auth/me)
// Requires authentication - returns user info based on JWT token
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
