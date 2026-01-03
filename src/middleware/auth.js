const { verifyToken } = require('../config/jwt');
const User = require('../models/userModel');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        req.user = decoded;

        // Optionally, fetch full user from database
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.userDoc = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({
            success: false,
            message: error.message || 'Invalid or expired token'
        });
    }
};

/**
 * Optional middleware - authenticate if token is present, but don't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            req.user = decoded;

            const user = await User.findById(decoded.id).select('-password');
            if (user) {
                req.userDoc = user;
            }
        }
        next();
    } catch (error) {
        // If token is invalid, just continue without user info
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};
