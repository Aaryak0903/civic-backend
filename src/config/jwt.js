const jwt = require('jsonwebtoken');

/**
 * JWT Configuration
 */
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Token expires in 7 days
    issuer: 'civic-app'
};

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
    };

    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        issuer: JWT_CONFIG.issuer
    });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_CONFIG.secret, {
            issuer: JWT_CONFIG.issuer
        });
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

module.exports = {
    JWT_CONFIG,
    generateToken,
    verifyToken
};
