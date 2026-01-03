const mongoose = require('mongoose');

/**
 * Issue Schema
 */
const issueSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Issue description is required'],
        trim: true,
        minlength: [10, 'Issue description must be at least 10 characters long'],
        maxlength: [1000, 'Issue description cannot exceed 1000 characters']
    },
    imageLink: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                // Allow empty string, valid URL, or data URI (base64)
                if (!v) return true;
                return /^https?:\/\/.+/.test(v) || /^data:image\/.+;base64,/.test(v);
            },
            message: 'Please provide a valid image URL or base64 image'
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Location coordinates are required'],
            validate: {
                validator: function (v) {
                    return v.length === 2 &&
                        v[0] >= -180 && v[0] <= 180 && // longitude
                        v[1] >= -90 && v[1] <= 90;     // latitude
                },
                message: 'Invalid coordinates. Format: [longitude, latitude]'
            }
        },
        address: {
            type: String,
            trim: true
        }
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    region: {
        type: String,
        trim: true,
        required: [true, 'Region is required']
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User authentication is required to report an issue']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    upvotes: {
        type: Number,
        default: 0
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Create compound index for common queries
issueSchema.index({ status: 1, region: 1 });
issueSchema.index({ category: 1, status: 1 });

/**
 * Method to increment upvotes
 */
issueSchema.methods.upvote = async function () {
    this.upvotes += 1;
    return await this.save();
};

/**
 * Method to add a comment
 */
issueSchema.methods.addComment = async function (userId, text) {
    this.comments.push({
        user: userId,
        text: text
    });
    return await this.save();
};

/**
 * Static method to find nearby issues
 */
issueSchema.statics.findNearby = function (longitude, latitude, maxDistance = 5000) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance // in meters
            }
        }
    });
};

// Create and export the Issue model
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
