const express = require('express');
const router = express.Router();

const {
  sendWarning,
  removeStudent,
} = require('../controllers/testController');

// Route to send warning
router.post('/send-warning', sendWarning);

// Route to remove student
router.post('/remove-student', removeStudent);

module.exports = router;
