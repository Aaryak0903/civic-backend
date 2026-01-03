require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/signup and /api/auth/login`);
            console.log(`Issues API: http://localhost:${PORT}/api/issues`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
