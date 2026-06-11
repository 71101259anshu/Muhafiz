import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import './FAQ.css';

const FAQ = () => {
  return (
    <div className="faq-wrapper">
      <Navbar />
      <div className="faq-content">
        <Link to="/" className="back-btn">← Back to Home</Link>
        
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-subtext">Quick answers to common questions about Kvizroom.</p>

        <div className="faq-card">
          <h2>Q: How does the AI proctoring system (Muhafiz) work?</h2>
          <p>
            It monitors webcam feeds, sound inputs, and browser tab active states to flag potential 
            academic violations. All validation descriptors are processed securely.
          </p>

          <h2>Q: Can I integrate with Google Forms?</h2>
          <p>
            Yes! You can instantly import test questions and format parameters from legacy files 
            like Google Forms and Microsoft Surveys in our dashboard.
          </p>

          <h2>Q: How do students log in?</h2>
          <p>
            We utilize a secure facial biometric scan checking process. During registration, a student 
            saves their facial descriptor, which serves as a second factor authentication checking key.
          </p>

          <h2>Q: Is Kvizroom free to use?</h2>
          <p>
            Yes, we offer a free Starter plan that supports up to 5 students and includes face verification! 
            For larger classes, see our Pricing plans.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
