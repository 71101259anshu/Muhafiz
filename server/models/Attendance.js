const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    date: {
        type: String, // Storing as YYYY-MM-DD for simple querying
        required: true
    },
    records: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        studentName: String,
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late', 'Excused'],
            default: 'Present'
        }
    }]
}, { timestamps: true });

// Ensure one record per class per day
attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
