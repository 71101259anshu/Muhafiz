const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createClasswork,
    getClasswork,
    deleteClasswork,
    updateClasswork
} = require('../controllers/classworkController');
const submissionController = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

// Multer Config (Same as posts)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const upload = multer({ storage });

// Classwork Routes
router.post('/', protect, upload.single('file'), createClasswork);
router.get('/:classId', protect, getClasswork);
router.delete('/:id', protect, deleteClasswork);
router.put('/:id', protect, updateClasswork);

// Submission Routes
router.post('/:id/submit', protect, upload.array('files', 5), submissionController.submitAssignment); // Allow up to 5 files
router.get('/:id/submissions', protect, submissionController.getSubmissions);
router.get('/:id/my-submission', protect, submissionController.getMySubmission);
router.put('/submissions/:subId', protect, submissionController.gradeSubmission);
router.post('/:id/unsubmit', protect, submissionController.unsubmitAssignment);

module.exports = router;
