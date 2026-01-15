const mongoose = require('mongoose');

const classworkSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['assignment', 'material'],
        required: true,
        default: 'material'
    },
    topic: {
        type: String,
        default: 'General'
    },
    dueDate: {
        type: Date
    },
    attachments: [{
        url: String,
        name: String,
        fileType: String
    }],
    maxGrade: {
        type: Number,
        default: 100
    }
}, {
    timestamps: true
});

const Classwork = mongoose.model('Classwork', classworkSchema);
module.exports = Classwork;
