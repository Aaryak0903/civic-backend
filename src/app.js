const cors = require('cors');
require('dotenv').config();
const express = require('express');

// Import routes
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(cors());

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use(
    (req, res, next) => {
        const origin = req.headers.origin;
        const allowedOrigins = [
            'http://localhost:8000',
            'http://localhost:5173',
            'https://civicsense-ui-34.vercel.app',
        ]
        if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
            return res.status(200).json({});
        }

        next();
    })
// Routes
const sseRoutes = require('./routes/sseRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/upload', uploadRoutes); // Keeping this if you need it, though your current flow uses Issue create for images.
app.use('/api/sse', sseRoutes.router);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

module.exports = app;
