const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtp, verifyOtp } = require('./otpController');
const nodemailer = require('nodemailer');


// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register User
const registerUser = async (req, res) => {
  const { username, email, password, photo, acceptedTerms, otp,  role } = req.body;

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
      _id: user._id,
      username: user.username,
      email: user.email,
      photo: user.photo,
      token: generateToken(user._id),
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

  // Send email using nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP is: ${otp}`,
  });

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

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  sendResetOtp,
  resetPassword,
};

