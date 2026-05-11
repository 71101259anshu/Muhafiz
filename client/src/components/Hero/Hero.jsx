import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import './Hero.css';

/* ── Typewriter Hook ── */
const useTypewriter = (words) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % words.length;
      const fullText = words[i];
      setText(isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1)
      );
      setTypingSpeed(isDeleting ? 50 : 150);
      if (!isDeleting && text === fullText) setTimeout(() => setIsDeleting(true), 1500);
      else if (isDeleting && text === '') { setIsDeleting(false); setLoopNum(loopNum + 1); }
    };
    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, words]);

  return text;
};

/* ── Hero Component ── */
const Hero = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const headlineText = useTypewriter(['Class', 'Quiz']);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/login`,
        { email, password }
      );
      const { _token: token, user: userData } = response.data;
      login(userData, token);
      toast.success('Welcome back! 🎉');
      const role = userData?.role || (token ? jwtDecode(token).role : null);
      navigate(role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid email or password';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero-container">
      <div className="hero-content">

        {/* ── Left: Text Side ── */}
        <div className="hero-text-side">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-dot"></span>
            AI-Powered Learning Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="hero-title-welcome">Welcome to</span>
            <br />
            <span className="hero-title-brand">
              <span
                className="hero-brand-dynamic"
                style={{
                  color: headlineText.includes('Quiz') ? '#fbbf24' : '#34d399',
                  transition: 'color 0.3s ease'
                }}
              >
                {headlineText || <span style={{ opacity: 0 }}>Class</span>}
              </span>
              <span className="hero-brand-static">room</span>
              <span className="hero-cursor">|</span>
            </span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Experience seamless learning, smart quizzes, and AI-powered proctoring — all in one place.
          </motion.p>

          {/* Stats row */}
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="hero-stat">
              <span className="hero-stat-num">10K+</span>
              <span className="hero-stat-label">Students</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">500+</span>
              <span className="hero-stat-label">Classrooms</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">99%</span>
              <span className="hero-stat-label">Uptime</span>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Login / Classroom Card ── */}
        <motion.div
          className="hero-card-side"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          {user ? (
            /* Logged-in state */
            <div className="hero-glass-card">
              <div className="hero-card-welcome-icon">👋</div>
              <h3 className="hero-card-title">Welcome back,</h3>
              <p className="hero-card-name">{user.username || user.name || 'Friend'}!</p>
              <p className="hero-card-sub">Ready to continue your learning journey?</p>
              <Link to="/classroom" className="hero-card-btn-primary">
                Go to Classroom <FiArrowRight />
              </Link>
              <Link to="/invite" className="hero-card-btn-secondary">
                Join a Quiz
              </Link>
            </div>
          ) : (
            /* Login card */
            <div className="hero-glass-card">
              <div className="hero-card-header">
                <h3 className="hero-card-title">Sign In</h3>
                <p className="hero-card-sub">Access your classroom instantly</p>
              </div>

              <form className="hero-login-form" onSubmit={handleLogin}>
                <div className="hero-input-group">
                  <FiMail className="hero-input-icon" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="hero-input"
                    required
                  />
                </div>

                <div className="hero-input-group">
                  <FiLock className="hero-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="hero-input"
                    required
                  />
                  <button
                    type="button"
                    className="hero-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="hero-card-btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="hero-btn-spinner"></span>
                  ) : (
                    <>Sign In <FiArrowRight /></>
                  )}
                </button>

                {loginError && (
                  <div className="hero-login-error">
                    {loginError}
                  </div>
                )}
              </form>

              <div className="hero-card-divider">
                <span>or</span>
              </div>

              <Link to="/invite" className="hero-card-btn-secondary">
                Join with Class Code
              </Link>

              <p className="hero-card-footer-text">
                New here? <Link to="/register">Create an account</Link>
              </p>
            </div>
          )}
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
