const mongoose = require('mongoose');
const Post = require('../models/Post');
const Class = require('../models/Class');

// Create Post
const createPost = async (req, res) => {
    // console.log('Create Post Request Body:', req.body);
    // console.log('Create Post Request File:', req.file);
    const { content, classId, isPrivate, recipient } = req.body;

    if (!content && !req.file) {
        return res.status(400).json({ message: 'Content or file is required' });
    }

    try {
        const newPost = new Post({
            content,
            class: classId,
            author: req.user._id,
            isPrivate: isPrivate === 'true' || isPrivate === true,
            // recipient: recipient && recipient !== 'undefined' && recipient !== '' ? recipient : null
            // Better to strictly check if it looks like an ObjectId or just rely on truthy logic if we know it's a string
            recipient: (recipient && recipient.match(/^[0-9a-fA-F]{24}$/)) ? recipient : null
        });

        if (req.file) {
            newPost.attachments.push({
                url: `/uploads/${req.file.filename}`,
                name: req.file.originalname,
                type: req.file.mimetype
            });
        }

        const savedPost = await newPost.save();

        // Populate author details for immediate UI update
        await savedPost.populate('author', 'username photo');

        const io = req.app.get('io');
        io.emit('new_post', savedPost);

        res.status(201).json(savedPost);
    } catch (err) {
        console.error("Create Post Error:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
};

// Get Posts for a Class
const getClassPosts = async (req, res) => {
    try {
        // Fetch all posts for the class first
        const allPosts = await Post.find({ class: req.params.classId })
            .populate('author', 'username photo')
            .populate('comments.author', 'username photo')
            .sort({ createdAt: -1 });

        // Filter in memory to handle ID comparisons reliably
        const posts = allPosts.filter(post => {
            if (!post.isPrivate) return true; // Public posts always visible

            const userId = req.user._id.toString();
            const authorId = post.author?._id?.toString();
            const recipientId = post.recipient?.toString();

            // console.log(`Checking Post ${post._id}: User=${userId}, Author=${authorId}, Recipient=${recipientId}`);

            return (authorId === userId) || (recipientId === userId);
        });

        // console.log(`Found ${posts.length} posts for user ${req.user._id}`);
        // posts.forEach(p => {
        //     if (p.isPrivate) console.log(`Private Post found: ${p._id} | Author: ${p.author._id} | Recipient: ${p.recipient}`);
        // });

        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Add Comment
const addComment = async (req, res) => {
    const { content } = req.body;
    const { id } = req.params; // Post ID

    if (!content) return res.status(400).json({ message: 'Comment content required' });

    try {
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = {
            content,
            author: req.user._id,
            date: new Date()
        };

        post.comments.push(comment);
        await post.save();

        // Return the full post or just the new comment? 
        // Better to return the updated post or re-fetch on frontend.
        // Let's return the added comment with populated author for immediate UI update.

        // We need to populate the author of the new comment to return it
        // Re-fetching the post to get populated comments
        const updatedPost = await Post.findById(id)
            .populate('author', 'username photo')
            .populate('comments.author', 'username photo');

        if (global.io) {
            global.io.emit('update_post', updatedPost);
        }

        res.json(updatedPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete Post
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check user: specific user or admin
        // Assuming req.user is populated by auth middleware
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await post.deleteOne();

        if (global.io) {
            global.io.emit('delete_post', req.params.id);
        }

        res.json({ message: 'Post removed' });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createPost, getClassPosts, addComment, deletePost };
