const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true },
    section: { type: String },
    subject: { type: String },
    room: { type: String },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    code: {
        type: String,
        required: true,
        unique: true
    },
    bannerImage: { type: String } // Store gradient string or image URL
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
