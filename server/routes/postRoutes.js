const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createPost, getClassPosts, addComment, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const upload = multer({ storage });

router.post('/', protect, upload.single('file'), createPost);
router.get('/:classId', protect, getClassPosts);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
