const Issue = require('../models/issueModel');
const supabase = require('../config/supabase');
const path = require('path');

/**
 * Create a new issue
 * POST /api/issues/create
 */
exports.createIssue = async (req, res) => {
    try {
        let { text, imageLink, location, category, region } = req.body;

        // Validate required fields
        if (!text || !location || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: text, location, and category are required'
            });
        }

        // --- NEW LOGIC: Handle Base64 Upload to Supabase ---
        if (imageLink && imageLink.startsWith('data:image/')) {
            try {
                console.log('Detected base64 image, uploading to Supabase...');

                // Extract base64 data and extension
                const matches = imageLink.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const extension = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');

                    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;

                    const { data, error } = await supabase.storage
                        .from('citizen-images')
                        .upload(fileName, buffer, {
                            contentType: `image/${extension}`,
                            upsert: false
                        });

                    if (error) {
                        console.error('Supabase upload error:', error);
                        // We continue with the base64 if upload fails, or we can throw error
                    } else {
                        // Get public URL and replace imageLink
                        const { data: publicUrlData } = supabase.storage
                            .from('citizen-images')
                            .getPublicUrl(fileName);

                        imageLink = publicUrlData.publicUrl;
                        console.log('Upload successful, new URL:', imageLink);
                    }
                }
            } catch (uploadError) {
                console.error('Error in base64 processing:', uploadError);
                // Fallback: keep the original imageLink if processing fails
            }
        }
        // --------------------------------------------------

        // Validate location format
        if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Location must include coordinates array [longitude, latitude]'
            });
        }

        // Create issue object with authenticated user
        const issueData = {
            text,
            imageLink: imageLink || '',
            location: {
                type: 'Point',
                coordinates: location.coordinates,
                address: location.address || ''
            },
            category,
            region: region || 'unknown',
            reportedBy: req.user.id // User ID from JWT token
        };

        // Create new issue
        const issue = new Issue(issueData);
        await issue.save();

        // Populate the reportedBy field to include user info in response
        await issue.populate('reportedBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Issue reported successfully',
            data: {
                id: issue._id,
                text: issue.text,
                imageLink: issue.imageLink,
                location: issue.location,
                category: issue.category,
                status: issue.status,
                region: issue.region,
                priority: issue.priority,
                upvotes: issue.upvotes,
                reportedBy: issue.reportedBy,
                createdAt: issue.createdAt
            }
        });
    } catch (error) {
        console.error('Create issue error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create issue',
            error: error.message
        });
    }
};

/**
 * Get a single issue by ID
 * GET /api/issues/:id
 */
exports.getIssueById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid issue ID format'
            });
        }

        const issue = await Issue.findById(id)
            .populate('reportedBy', 'name email')
            .populate('comments.user', 'name');

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error('Get issue error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve issue',
            error: error.message
        });
    }
};

/**
 * Get issues with filters
 * GET /api/issues?status=open&region=xyz&category=road&limit=10&page=1
 */
exports.getIssues = async (req, res) => {
    try {
        const {
            status,
            region,
            category,
            priority,
            reportedBy, // Filter by user ID (Foreign Key)
            limit = 20,
            page = 1,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (region) {
            filter.region = region;
        }

        if (category) {
            filter.category = category;
        }

        if (priority) {
            filter.priority = priority;
        }

        // Add Foreign Key filter: only show issues created by this user
        if (reportedBy) {
            filter.reportedBy = reportedBy;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'asc' ? 1 : -1;

        // Execute query with pagination
        const issues = await Issue.find(filter)
            .populate('reportedBy', 'name email')
            .sort({ [sortBy]: sortOrder })
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count for pagination
        const total = await Issue.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: issues,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve issues',
            error: error.message
        });
    }
};

/**
 * Update issue status
 * PATCH /api/issues/:id/status
 */
exports.updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = req.userDoc;

        // Check if user is an officer
        if (user.role !== 'government_officer' && user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only officers can update issue status.'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const issue = await Issue.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Issue status updated successfully',
            data: issue
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update issue status',
            error: error.message
        });
    }
};

/**
 * Upvote an issue
 * POST /api/issues/:id/upvote
 */
exports.upvoteIssue = async (req, res) => {
    try {
        const { id } = req.params;

        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        await issue.upvote();

        res.status(200).json({
            success: true,
            message: 'Issue upvoted successfully',
            data: {
                id: issue._id,
                upvotes: issue.upvotes
            }
        });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upvote issue',
            error: error.message
        });
    }
};

/**
 * Add comment to an issue
 * POST /api/issues/:id/comment
 */
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        await issue.addComment(req.user?.id, text);

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: issue
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
};

/**
 * Get nearby issues
 * GET /api/issues/nearby?longitude=77.5946&latitude=12.9716&maxDistance=5000
 */
exports.getNearbyIssues = async (req, res) => {
    try {
        const { longitude, latitude, maxDistance = 5000 } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required'
            });
        }

        const issues = await Issue.findNearby(
            parseFloat(longitude),
            parseFloat(latitude),
            parseInt(maxDistance)
        );

        res.status(200).json({
            success: true,
            data: issues,
            count: issues.length
        });
    } catch (error) {
        console.error('Get nearby issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve nearby issues',
            error: error.message
        });
    }
};
/**
 * Get issues reported by the current user
 * GET /api/issues/my-issues
 */
exports.getMyIssues = async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const userId = req.user.id;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const issues = await Issue.find({ reportedBy: userId })
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Issue.countDocuments({ reportedBy: userId });

        res.status(200).json({
            success: true,
            data: issues,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get my issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve your issues',
            error: error.message
        });
    }
};

/**
 * Get issues for government officer dashboard (filtered by officer's location/region)
 * GET /api/issues/officer-dashboard
 */
exports.getOfficerIssues = async (req, res) => {
    try {
        const { limit = 20, page = 1, status } = req.query;
        const user = req.userDoc;

        if (user.role !== 'government_officer' && user.role !== 'officer') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only officers can access this dashboard.'
            });
        }

        const filter = {};
        if (status) {
            filter.status = status;
        }

        // Logic for location-based filtering:
        // 1. If user has a region assigned, filter by region
        // 2. If user has coordinates, we could filter by proximity (e.g., 10km)
        // For now, let's prioritize region match if available in user's location object

        if (user.location) {
            if (typeof user.location === 'string') {
                filter.region = user.location;
            } else if (user.location.region) {
                filter.region = user.location.region;
            } else if (user.location.coordinates) {
                // Proximity search if no region but coordinates exist
                const [lng, lat] = user.location.coordinates;
                // Add geo filter to the main filter object
                filter.location = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        $maxDistance: 10000 // 10km radius for officers by default
                    }
                };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const issues = await Issue.find(filter)
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Issue.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: issues,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get officer issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve officer issues',
            error: error.message
        });
    }
};
