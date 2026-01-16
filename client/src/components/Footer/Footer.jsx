import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTwitter, FaLinkedin, FaGithub, FaInstagram, FaGraduationCap, FaCheckCircle } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <Link to="/" className="brand-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="logo-icon-wrapper" style={{ width: '32px', height: '32px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaGraduationCap className="shield-icon" style={{ fontSize: '32px', color: '#2CB1BC' }} />
                            <FaCheckCircle className="check-icon" style={{ position: 'absolute', bottom: '-2px', right: '-4px', fontSize: '14px', color: 'white', background: '#1F3A5F', borderRadius: '50%', border: '2px solid #1F3A5F' }} />
                        </div>
                        <span className="brand-text" style={{ fontSize: '1.4rem', fontFamily: 'var(--font-main)' }}>
                            <span className="brand-primary" style={{ color: 'white', fontWeight: '800' }}>Kviz</span>
                            <span className="brand-secondary" style={{ color: '#2CB1BC', fontWeight: '500' }}>room</span>
                        </span>
                    </Link>
                    <p>Empowering education with secure, intelligent, and seamless classroom technology.</p>
                </div>

                <div className="footer-links">
                    <div className="link-column">
                        <h4>Quick Links</h4>
                        <Link to="/invite">Quizroom</Link>
                        <Link to="/classroom">Classroom</Link>
                        <Link to="/pricing">Pricing</Link>
                    </div>
                    <div className="link-column">
                        <h4>Support</h4>
                        <Link to="/contact">Contact Us</Link>
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; 2026 Kvizroom Inc. All rights reserved.</p>
                <div className="social-links">
                    <motion.a href="https://github.com/git-anshudubey" target="_blank" rel="noopener noreferrer" whileHover={{ y: -3, color: "#2CB1BC" }} transition={{ type: "spring", stiffness: 300 }}><FaGithub /></motion.a>
                    <motion.a href="https://www.linkedin.com/in/anshu-dubey-1b76aa330/" target="_blank" rel="noopener noreferrer" whileHover={{ y: -3, color: "#2CB1BC" }} transition={{ type: "spring", stiffness: 300 }}><FaLinkedin /></motion.a>
                    <motion.a href="https://x.com/AnshuDubey76065" target="_blank" rel="noopener noreferrer" whileHover={{ y: -3, color: "#2CB1BC" }} transition={{ type: "spring", stiffness: 300 }}><FaTwitter /></motion.a>
                    <motion.a href="https://www.instagram.com/from_jump_aug/?hl=en" target="_blank" rel="noopener noreferrer" whileHover={{ y: -3, color: "#2CB1BC" }} transition={{ type: "spring", stiffness: 300 }}><FaInstagram /></motion.a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
