const express = require('express');
const router = express.Router();
const multer = require("multer");
const {
  createTest,
  updateTest,
  deleteTest,
  getAllTests,
  sendTestInviteToEmails,
  validateInviteCodeandEmail,
  getTestById,
  markStudentAttended,
  logInactivity,
  getStudentActivity,
  getDashboardStats,
  removeStudentPermanently,
  logMalpractice, // Import
  submitTest,      // Import
  getStudentTest,   // Import
  getTestResults,
  updateResultScore,
  toggleReleaseScores,
  sendResultEmails,
  getDetailedResult,
  shareTestToClass
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // store in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Routes
router.post('/', protect, upload.any(), createTest); // ✅ single unified route for createTest with file upload
router.get('/', protect, getAllTests);
router.put('/:id', protect, updateTest);
router.delete('/:id', protect, deleteTest);
router.post('/send-invite', protect, sendTestInviteToEmails);
router.post('/validate-invite', validateInviteCodeandEmail);
router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/:id', getTestById);
router.post('/:id/mark-attended', markStudentAttended);
router.post('/:testId/log-inactivity', logInactivity);
router.post('/:testId/log-malpractice', logMalpractice); // Malpractice Logging
router.get('/:testId/activity', getStudentActivity);
router.post('/:testId/remove-student', removeStudentPermanently);
router.post('/submit', protect, upload.any(), submitTest);       // Grading Submission
router.get('/:id/student', protect, getStudentTest); // Student Exam View

// Grading Routes
router.get('/:testId/results', protect, getTestResults); // Admin: Get all results
router.put('/results/:resultId/grade', protect, updateResultScore); // Admin: Manual Grade
router.get('/results/:resultId/view', protect, getDetailedResult); // Student/Admin: View Detailed Result
router.put('/:testId/publish', protect, toggleReleaseScores); // Admin: Toggle Publish Status
router.post('/:testId/email-results', protect, sendResultEmails); // Admin: Send Result Emails
router.post('/share-to-class', protect, shareTestToClass); // Admin: Share test to classroom

module.exports = router;
