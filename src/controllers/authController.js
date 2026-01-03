const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');

/**
 * Handle user signup
 */
const signup = async (req, res) => {
    try {
        const { name, email, password, role, location, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user (password will be hashed automatically by pre-save middleware)
        const newUser = new User({
            name,
            email,
            password,
            role,
            location,
            phone
        });

        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: newUser.toJSON(), // This will exclude the password
                token
            }
        });
    } catch (error) {
        console.error('Signup error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        // Handle duplicate key error (email already exists)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Handle user login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Validate password using the comparePassword method
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(), // This will exclude the password
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Get current user based on JWT token
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by authenticateToken middleware
        // req.userDoc contains the full user document

        if (!req.userDoc) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: {
                user: req.userDoc.toJSON() // Excludes password
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    signup,
    login,
    getCurrentUser
};
