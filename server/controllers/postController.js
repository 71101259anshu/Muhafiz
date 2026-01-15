const Post = require('../models/Post');
const Class = require('../models/Class');

// Create Post
const createPost = async (req, res) => {
    console.log('Create Post Request Body:', req.body);
    console.log('Create Post Request File:', req.file);
    const { content, classId } = req.body;

    if (!content && !req.file) {
        return res.status(400).json({ message: 'Content or file is required' });
    }

    try {
        const postData = {
            content: content || '',
            class: classId,
            author: req.user._id,
            attachments: []
        };

        if (req.file) {
            // Assuming the server serves 'uploads' folder statically
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            postData.attachments.push({
                url: fileUrl,
                name: req.file.originalname,
                type: req.file.mimetype
            });
        }

        const newPost = await Post.create(postData);

        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'username photo');

        if (global.io) {
            global.io.emit('new_post', populatedPost);
        }

        res.status(201).json(populatedPost);
    } catch (err) {
        console.error(err); // Improved logging
        res.status(500).json({ message: err.message, error: err });
    }
};

// Get Posts for a Class
const getClassPosts = async (req, res) => {
    try {
        const posts = await Post.find({ class: req.params.classId })
            .sort({ createdAt: -1 }) // Newest first
            .populate('author', 'username photo')
            .populate('comments.author', 'username photo');

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
