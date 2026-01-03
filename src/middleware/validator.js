/**
 * Validate signup request
 */
const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;

    // Check if all fields are present
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide name, email, and password'
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
        });
    }

    // Validate name length
    if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Name must be a string of at least 2 characters'
        });
    }

    // Validate role and location if present
    const { role, location } = req.body;
    if (role) {
        if (!['citizen', 'government_officer', 'officer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either citizen, officer or government_officer'
            });
        }

        if (role === 'government_officer') {
            if (!location) {
                return res.status(400).json({
                    success: false,
                    message: 'Location is required for government officers'
                });
            }
        }
    }

    next();
};

/**
 * Validate login request
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    // Check if all fields are present
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password'
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    next();
};

module.exports = {
    validateSignup,
    validateLogin
};
