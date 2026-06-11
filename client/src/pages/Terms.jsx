import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import './Terms.css';

const Terms = () => {
  return (
    <div className="terms-wrapper">
      <Navbar />
      <div className="terms-content">
        <Link to="/" className="back-btn">← Back to Home</Link>
        
        <h1 className="terms-title">Terms of Service</h1>
        <p className="terms-subtext">Last Updated: June 12, 2026</p>

        <div className="terms-card">
          <h2>1. Use of Service</h2>
          <p>
            Kvizroom provides online classroom management, quiz building, and automated proctoring services. 
            By utilizing our platform, you agree to comply with academic integrity standards.
          </p>

          <h2>2. Academic Integrity & Proctoring</h2>
          <p>
            Muhafiz proctoring uses biometric, webcam, and tab monitoring technology to secure exams. 
            Attempts to bypass or interfere with the proctoring agents are logged and reported to administrators.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            You are responsible for keeping your credentials safe. You must capture a valid live photo 
            during registration for facial verification login checks.
          </p>

          <h2>4. Terminations</h2>
          <p>
            We reserve the right to suspend accounts violating our Terms of Service or engaging in malicious 
            actions.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
