import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from "../../context/AuthContext";
import './Hero.css';

const useTypewriter = (words, loop = true) => {
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

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, words]);

  return text;
};

const Hero = () => {
  const { user } = useContext(AuthContext);
  const headlineText = useTypewriter(["Class", "Quiz"]);

  return (
    <section className="hero-container">
      {/* Background Animations */}
      <div className="hero-bg-shape shape-1"></div>
      <div className="hero-bg-shape shape-2"></div>

      <div className="hero-content">
        {/* Text Side */}
        <div className="hero-text-side">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome to <br />
            {/* Dynamic Color Logic: Class=Teal, Quiz=Warning/Yellow */}
            <span className="highlight-text" style={{
              color: headlineText.includes('Quiz') ? '#F59E0B' : '#2CB1BC',
              minWidth: '120px',
              display: 'inline-block',
              transition: 'color 0.3s ease'
            }}>
              {headlineText}
              <span style={{ color: '#fff' }}>room</span>
            </span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 1 }} // Parent is visible immediately, children animate
            animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '1rem', color: '#64748b', fontWeight: '500' }}
          >
            {"and experience the Learning with Kvizroom".split(" ").map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + (index * 0.1), // Stagger effect
                  type: "spring",
                  stiffness: 100
                }}
                style={{
                  color: word === 'Kvizroom' ? '#2CB1BC' : 'inherit',
                  fontWeight: word === 'Kvizroom' ? '700' : 'inherit'
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {user ? (
              <Link to="/classroom" className="btn-primary" style={{ minWidth: '220px', textAlign: 'center' }}>
                Go to your Classroom
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary">Log In</Link>
                <Link to="/register" className="btn-secondary">Register</Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Visual Side (3D Effect) */}
        <motion.div
          className="hero-visual-side"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="mockup-card">
            <div className="mockup-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
            </div>
            <div className="mockup-body">
              <span className="code-line">&lt;Kvizroom initialized /&gt;</span>
              <span className="code-line" style={{ color: 'white' }}>
                User: "{user?.username || user?.name || "Student_01"}"
              </span>
              <span className="code-line">AI_Proctor: "Active"</span>
              <span className="code-line">Status: "{user ? "Present" : "Absent"}"</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
