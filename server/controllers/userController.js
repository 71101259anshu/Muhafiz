const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const { sendOtp, verifyOtp } = require('./otpController');


// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register User
const registerUser = async (req, res) => {
  const { username, email, password, photo, acceptedTerms, otp, role } = req.body;

  if (!verifyOtp(email, otp)) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }


  try {
    // Validate fields
    if (!username || !email || !password || !photo || !acceptedTerms) {
      return res.status(400).json({ message: 'Please fill all fields and accept terms.' });
    }

    // Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      photo,
      role,
      faceDescriptor: req.body.faceDescriptor || [], // Save descriptor
    });

    // Send response
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      photo: user.photo,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Respond with token
    res.json({
      _token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const otpStore = {}; // Temporary store

// 1. Send reset OTP
const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Password Reset</h2>
          <p style="color: #374151;">Use the OTP below to reset your Kvizroom password. It expires in <strong>5 minutes</strong>.</p>
          <div style="font-size: 2.5rem; font-weight: 900; letter-spacing: 12px; color: #111827; background: #e0e7ff; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 24px 0;">${otp}</div>
          <p style="color: #6b7280; font-size: 0.85rem;">If you did not request this, ignore this email.</p>
        </div>
      `;
    
    await sendEmail(email, 'Your Kvizroom Password Reset OTP', html);
  } catch (emailErr) {
    console.error('Failed to send OTP email:', emailErr.message);
    // Still respond — OTP is stored in memory, user can retry
    return res.status(500).json({ message: 'Failed to send OTP email. Check server email config.' });
  }

  res.status(200).json({ message: 'OTP sent to your email' });
};

// 2. Reset password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const data = otpStore[email];

  if (!data || data.otp !== otp || Date.now() > data.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  delete otpStore[email]; // Clear OTP
  res.status(200).json({ message: 'Password reset successful' });
};

// 3. Get Biometric Data (Protected)
const getBiometricData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // req.user set by middleware
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      hasBiometric: user.faceDescriptor && user.faceDescriptor.length === 128,
      faceDescriptor: user.faceDescriptor,
      photoUrl: user.photo // Send photo URL as fallback
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  sendResetOtp,
  resetPassword,
  getBiometricData,
};

