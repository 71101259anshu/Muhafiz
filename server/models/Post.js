const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
    content: { type: String },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    attachments: [
        {
            url: { type: String },
            name: { type: String },
            type: { type: String }
        }
    ],
    isPrivate: { type: Boolean, default: false },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
