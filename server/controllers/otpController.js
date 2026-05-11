const { Resend } = require('resend');
require('dotenv').config();

// Store OTPs temporarily (in-memory)
const otpStore = {};

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Kvizroom <onboarding@resend.dev>',
      to: email,
      subject: 'Your Kvizroom Verification OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Email Verification</h2>
          <p style="color: #374151;">Use the OTP below to verify your email for Kvizroom. It expires in <strong>5 minutes</strong>.</p>
          <div style="font-size: 2.5rem; font-weight: 900; letter-spacing: 12px; color: #111827; background: #e0e7ff; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 24px 0;">${otp}</div>
          <p style="color: #6b7280; font-size: 0.85rem;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    // Store OTP only after successful send
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    res.status(200).json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Failed to send OTP:', error.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

const verifyOtp = (email, enteredOtp) => {
  const data = otpStore[email];
  if (!data) return false;
  if (Date.now() > data.expiresAt) return false;
  return data.otp === enteredOtp;
};

module.exports = { sendOtp, verifyOtp };
