const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri || uri === 'REPLACE_WITH_YOU') {
            throw new Error('MONGODB_URI is not defined in .env or is still using the placeholder "REPLACE_WITH_YOU". Please add your actual MongoDB connection string to the .env file.');
        }

        if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
            throw new Error('Invalid MONGODB_URI scheme. It must start with "mongodb://" or "mongodb+srv://". base value: ' + uri);
        }

        const conn = await mongoose.connect(uri);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;
