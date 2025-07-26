const nodemailer = require('nodemailer');
require('dotenv').config();


// Store OTPs temporarily (in-memory for now)
const otpStore = {};

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Setup transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS,    
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP for Muhafiz is: ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 minutes expiry
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const verifyOtp = (email, enteredOtp) => {
  const data = otpStore[email];
  if (!data) return false;
  if (Date.now() > data.expiresAt) return false;
  return data.otp === enteredOtp;
};

module.exports = { sendOtp, verifyOtp };
