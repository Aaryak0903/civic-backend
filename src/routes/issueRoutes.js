const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/issues/create
 * @desc    Create a new civic issue
 * @access  Protected (requires JWT authentication)
 * @body    { text, imageLink, location: { coordinates: [lng, lat], address }, category, region }
 */
router.post('/create', authenticateToken, issueController.createIssue);

/**
 * @route   GET /api/issues/nearby
 * @desc    Get nearby issues based on location
 * @access  Public
 * @query   longitude, latitude, maxDistance (in meters, default 5000)
 * @example /api/issues/nearby?longitude=77.5946&latitude=12.9716&maxDistance=5000
 * NOTE: This route must come BEFORE /:id to avoid route conflicts
 */
router.get('/nearby', issueController.getNearbyIssues);

/**
 * @route   GET /api/issues/my-issues
 * @desc    Get issues reported by the current user
 * @access  Protected (requires JWT authentication)
 */
router.get('/my-issues', authenticateToken, issueController.getMyIssues);

/**
 * @route   GET /api/issues/officer-dashboard
 * @desc    Get issues for the officer's dashboard based on their location
 * @access  Protected (requires JWT authentication)
 */
router.get('/officer-dashboard', authenticateToken, issueController.getOfficerIssues);


/**
 * @route   GET /api/issues
 * @desc    Get issues with optional filters
 * @access  Public
 * @query   status, region, category, priority, reportedBy, limit, page, sortBy, order
 * @example /api/issues?status=open&region=xyz&limit=10&page=1
 */
router.get('/', issueController.getIssues);

/**
 * @route   GET /api/issues/:id
 * @desc    Get a single issue by ID
 * @access  Public
 */
router.get('/:id', issueController.getIssueById);

/**
 * @route   PATCH /api/issues/:id/status
 * @desc    Update issue status
 * @access  Protected (add auth middleware)
 * @body    { status }
 */
router.patch('/:id/status', authenticateToken, issueController.updateIssueStatus);

/**
 * @route   POST /api/issues/:id/upvote
 * @desc    Upvote an issue
 * @access  Public
 */
router.post('/:id/upvote', issueController.upvoteIssue);

/**
 * @route   POST /api/issues/:id/comment
 * @desc    Add a comment to an issue
 * @access  Protected (add auth middleware)
 * @body    { text }
 */
router.post('/:id/comment', issueController.addComment);

module.exports = router;
