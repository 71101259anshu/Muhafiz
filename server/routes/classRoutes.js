const express = require('express');
const router = express.Router();
const {
    createClass,
    joinClass,
    getMyClasses,
    getClassById,
    getClassMembers,
    markAttendance,
    getAttendance,
    getGradebook,
    removeStudent,
    deleteClass
} = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createClass);
router.post('/join', protect, joinClass);
router.get('/', protect, getMyClasses);
router.get('/:id', protect, getClassById);
router.delete('/:id', protect, deleteClass); // Added Delete Route
router.get('/:id/members', protect, getClassMembers);
router.post('/:id/attendance', protect, markAttendance);
router.get('/:id/attendance', protect, getAttendance);
router.get('/:id/gradebook', protect, getGradebook);
router.post('/:id/remove-student', protect, removeStudent);

module.exports = router;
