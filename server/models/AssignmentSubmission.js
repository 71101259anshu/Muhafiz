const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
    classwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classwork',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attachments: [{
        name: String,
        url: String,
        fileType: String
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['submitted', 'late', 'graded', 'returned'],
        default: 'submitted'
    },
    grade: {
        type: Number,
        default: null
    },
    feedback: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Prevent multiple submissions for same assignment by same student
assignmentSubmissionSchema.index({ classwork: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
