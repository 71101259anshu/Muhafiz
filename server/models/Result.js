const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Optional if you want to link to User model
    },
    studentEmail: {
        type: String,
        required: true,
    },
    studentName: {
        type: String,
    },
    score: {
        type: Number,
        required: true,
    },
    totalPoints: {
        type: Number,
        required: true,
    },
    answers: [
        {
            questionId: String,
            selectedOptions: [String], // Array of option IDs
            textAnswer: String, // For Short Answer / Paragraph
            fileUrl: String,    // For File Upload questions
            isCorrect: Boolean,
            pointsAwarded: Number,
            feedback: String, // Admin feedback
        }
    ],
    isGraded: {
        type: Boolean,
        default: false,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    malpracticeEvents: [
        {
            type: { type: String },
            message: String,
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
