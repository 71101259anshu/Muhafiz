import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.css";
import KvizroomLogo from '../KvizroomLogo/KvizroomLogo';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isHomepage = location.pathname === "/";

  // Handle scroll event to toggle background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle resize event to update mobile view status
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // get a display name fallback
  const displayText = user ? (user.username || user.name || user.email || "") : "";
  const initial = displayText ? displayText.charAt(0).toUpperCase() : "";

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      className={`navbar ${scrolled ? "scrolled" : ""} ${!isHomepage ? "non-homepage" : ""}`}
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
        {(menuOpen || !isMobile) && (
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
