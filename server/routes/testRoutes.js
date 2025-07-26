const express = require('express');
const router = express.Router();
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
} = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');

// Routes
router.post('/', protect, createTest);
router.get('/', protect, getAllTests);
router.put('/:id', protect, updateTest);
router.delete('/:id', protect, deleteTest);
router.post('/send-invite', protect, sendTestInviteToEmails);
router.post('/validate-invite', validateInviteCodeandEmail);
router.get('/dashboard-stats', getDashboardStats);
router.get('/:id', getTestById);
router.post('/:id/mark-attended', markStudentAttended);
router.post('/:testId/log-inactivity', logInactivity);
router.get('/:testId/activity', getStudentActivity);
router.post('/:testId/remove-student', removeStudentPermanently);



module.exports = router;
