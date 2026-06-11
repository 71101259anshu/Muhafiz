import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import './Privacy.css';

const Privacy = () => {
  return (
    <div className="privacy-wrapper">
      <Navbar />
      <div className="privacy-content">
        <Link to="/" className="back-btn">← Back to Home</Link>
        
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-subtext">Last Updated: June 12, 2026</p>

        <div className="privacy-card">
          <h2>1. Information We Collect</h2>
          <p>
            For proctoring sessions, we collect webcam frames (processed locally on your device where possible) 
            to verify attendee identity and monitor integrity. We also log browser actions such as tab switching.
          </p>

          <h2>2. Data Security</h2>
          <p>
            Your information is stored securely on protected MongoDB clusters. Video frames are never sold 
            or shared with third parties.
          </p>

          <h2>3. Cookies</h2>
          <p>
            We use simple authorization tokens (JWT) stored in your browser's local storage to keep you logged in.
          </p>

          <h2>4. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, contact us at 
            <strong> support@kvizroom.com</strong>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
