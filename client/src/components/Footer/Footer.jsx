import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaTwitter, FaLinkedin, FaGithub, FaInstagram,
  FaEnvelope, FaMapMarkerAlt
} from 'react-icons/fa';
import KvizroomLogo from '../KvizroomLogo/KvizroomLogo';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Top Grid */}
        <div className="footer-grid">

          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <KvizroomLogo variant="dark" size={38} />
            </Link>
            <p className="footer-tagline">
              Empowering education with secure, intelligent, and seamless classroom technology — built for the future.
            </p>
            <div className="footer-contact-row">
              <FaEnvelope className="footer-contact-icon" />
              <span>support@kvizroom.com</span>
            </div>
            <div className="footer-contact-row">
              <FaMapMarkerAlt className="footer-contact-icon" />
              <span>India</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="link-column">
            <h4 className="footer-col-title">Product</h4>
            <Link to="/invite">Quizroom</Link>
            <Link to="/classroom">Classroom</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/blog">Blog</Link>
          </div>

          {/* Support Links */}
          <div className="link-column">
            <h4 className="footer-col-title">Support</h4>
            <Link to="/contact">Contact Us</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/faq">FAQ</Link>
          </div>

          {/* Social Column */}
          <div className="footer-social-col">
            <h4 className="footer-col-title">Follow Us</h4>
            <div className="social-grid">
              <motion.a
                href="https://github.com/git-anshudubey"
                target="_blank" rel="noopener noreferrer"
                className="social-chip"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FaGithub /> GitHub
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/anshu-dubey-1b76aa330/"
                target="_blank" rel="noopener noreferrer"
                className="social-chip"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FaLinkedin /> LinkedIn
              </motion.a>
              <motion.a
                href="https://x.com/AnshuDubey76065"
                target="_blank" rel="noopener noreferrer"
                className="social-chip"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FaTwitter /> Twitter
              </motion.a>
              <motion.a
                href="https://www.instagram.com/from_jump_aug/?hl=en"
                target="_blank" rel="noopener noreferrer"
                className="social-chip"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FaInstagram /> Instagram
              </motion.a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; {currentYear} Kvizroom Inc. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <p className="footer-made-with">
            Made with <span style={{ color: '#ef4444' }}>♥</span> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
