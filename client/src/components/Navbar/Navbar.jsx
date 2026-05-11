import React, { useState, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.css";
import KvizroomLogo from '../KvizroomLogo/KvizroomLogo';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // get a display name fallback
  const displayText = user ? (user.username || user.name || user.email || "") : "";
  const initial = displayText ? displayText.charAt(0).toUpperCase() : "";

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="logo-container">
        <Link to="/" className="brand-logo">
          <KvizroomLogo variant="light" size={36} />
        </Link>
      </div>

      <div className="right-section">
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
          <div className={`bar ${menuOpen ? 'open' : ''}`}></div>
        </button>
      </div>

      <AnimatePresence>
        {(menuOpen || window.innerWidth > 768) && (
          <motion.nav
            className={`nav-links ${menuOpen ? "open" : ""}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ul>
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link to="/invite" onClick={() => setMenuOpen(false)}>Quizroom</Link>
              </motion.li>
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link to="/classroom" className="nav-highlight" onClick={() => setMenuOpen(false)}>Classroom</Link>
              </motion.li>

              {user ? (
                <li>
                  <div className="avatar-container" onClick={handleLogout} title={`Logout ${displayText}`}>
                    {(user.photo || user.avatar) ? (
                      <img
                        src={user.photo || user.avatar}
                        alt="Avatar"
                        className="avatar-img"
                      />
                    ) : (
                      <div className="avatar-circle">
                        {initial}
                      </div>
                    )}
                  </div>
                </li>
              ) : (
                <>
                  <motion.li whileHover={{ scale: 1.1 }}>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                  </motion.li>
                  <motion.li whileHover={{ scale: 1.05 }}>
                    <Link to="/register" className="btn-nav-register" onClick={() => setMenuOpen(false)}>Register</Link>
                  </motion.li>
                </>
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
