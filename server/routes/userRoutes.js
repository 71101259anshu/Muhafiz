const express = require('express');
const router = express.Router();
const { registerUser, sendOtp, loginUser, sendResetOtp, resetPassword} = require('../controllers/userController');
// const { sendOtp } = require('../controllers/otpController');


router.post('/register', registerUser);
router.post('/send-otp', sendOtp);
router.post('/login', loginUser);
router.post('/send-reset-otp', sendResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
