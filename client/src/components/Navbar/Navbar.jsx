import React, { useState } from "react";
import "./Navbar.css";
import logo from "../../assets/logo_muhafiz.png";
import { Link } from 'react-router-dom';
import { FiLogIn } from 'react-icons/fi';


const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleAuthClick = () => {
    setIsLoggedIn(prev => !prev); // Toggles login status
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="logo">
        <img src={logo} alt="Muhafiz" />
        <span>Muhafiz</span>
      </div>
      <div className="right-section">

        {/* Avatar */}
        <span className="avatar-container">
          <div className="avatar-circle">A</div>
        </span>

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

      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        <ul>
          
          <li><Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link></li>
          <li><Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link></li>
          <li><Link to="/blog" onClick={() => setMenuOpen(false)}>Blog</Link></li>
          <li><Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link></li>
          <li><Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link></li>
        </ul>

      </nav>
    </header>
  );
};

export default Navbar;
