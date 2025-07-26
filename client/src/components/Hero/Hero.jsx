import React, { useState } from 'react';
import './Hero.css';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Hero = () => {
  const [testCode, setTestCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleJoinTest = () => {
    if (!testCode.trim()) {
      toast.error('Please enter a valid test code');
      return;
    }
    setShowConfirmation(true);
  };

  const confirmJoin = () => {
    setShowConfirmation(false);
    toast.success(`Joined test with code "${testCode}"`);
    // Navigate or logic to actually join the test goes here
    setTestCode('');
  };

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Welcome to Muhafiz</h1>
          <TypeAnimation
            sequence={[
              'Seamless Exam Experience',
              2000,
              'Smart Anti-Cheating System',
              2000,
              'Built for Institutions & Students',
              2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
            className="typing-text"
          />
        </div>
      </section>

      <section className="test-actions" id="create-test">
        <div className="test-container">
          <Link to="/create-test" className="btn shared-btn">Create Test</Link>
          <Link to="/admin" className="btn shared-btn">Admin Dashboard</Link>
          <Link to="/invite" className="btn shared-btn">Join Test</Link>

        </div>
      </section>

    </>
  );
};

export default Hero;
