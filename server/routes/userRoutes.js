const express = require('express');
const router = express.Router();
const { registerUser, sendOtp, loginUser, sendResetOtp, resetPassword, getBiometricData } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
// const { sendOtp } = require('../controllers/otpController');


router.post('/register', registerUser);
router.post('/send-otp', sendOtp);
router.post('/login', loginUser);
router.post('/send-reset-otp', sendResetOtp);
router.post('/reset-password', resetPassword);
router.get('/biometric', protect, getBiometricData);

module.exports = router;
