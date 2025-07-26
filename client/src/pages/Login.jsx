import React, { useState } from 'react';
import './Login.css';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // ✅ import jwt-decode

const Login = () => {
  const navigate = useNavigate();

  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');

  const [showPopup, setShowPopup] = useState(false);
  const [step, setStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!emailLogin.trim() || !passwordLogin.trim()) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email: emailLogin,
        password: passwordLogin,
      });

      const { token } = response.data;
      const decoded = jwtDecode(token); // ✅ decode token to get role and email

      // ✅ Save user data
      localStorage.setItem('token', token);
      localStorage.setItem('role', decoded.role);
      localStorage.setItem('email', decoded.email);

      toast.success("Login successful!");

      // ✅ Redirect based on role
      decoded.role === 'admin' ? navigate('/admin') : navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const handleSendOtp = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/users/send-reset-otp', { email: resetEmail });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword.trim()) {
      toast.error("Please enter OTP and new password");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/users/reset-password', {
        email: resetEmail,
        otp,
        newPassword,
      });
      toast.success("Password reset successful");
      setShowPopup(false);
      setStep(1);
      setResetEmail('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="login-container">
      <Link to="/" className="back-btn">← Back to Home</Link>
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>

        <input
          type="email"
          placeholder="Email Address"
          value={emailLogin}
          onChange={(e) => setEmailLogin(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={passwordLogin}
          onChange={(e) => setPasswordLogin(e.target.value)}
          required
        />

        <button type="submit" className="btn login-btn">Login</button>

        <p className="forgot-password" onClick={() => setShowPopup(true)}>Forgot Password?</p>
        <p className="form-footer">
          Don’t have an account? <Link to="/register">Register here</Link>
        </p>
      </form>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <span className="close-btn" onClick={() => setShowPopup(false)}>&times;</span>

            {step === 1 ? (
              <>
                <h3>Reset Password</h3>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button onClick={handleSendOtp}>Send OTP</button>
              </>
            ) : (
              <>
                <h3>Enter OTP & New Password</h3>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={handleResetPassword}>Reset Password</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
