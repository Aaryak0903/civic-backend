const express = require('express');
const router = express.Router();
const Issue = require('../models/issueModel');

let clients = [];

/**
 * @route   GET /api/issues/stream
 * @desc    Stream real-time updates for issue status changes
 * @access  Public
 */
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };

    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

/**
 * Function to send updates to all connected clients
 * @param {Object} data - The data to send
 */
const sendUpdate = (data) => {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

// Export the router and the sendUpdate function
module.exports = { router, sendUpdate };
