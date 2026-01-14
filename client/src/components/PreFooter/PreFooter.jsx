import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './PreFooter.css';
import formIcon from '../../assets/Muhafiz_icon_02.png';
import dashIcon from '../../assets/Muhafiz_icon_01.png';

const PreFooter = () => {
  return (
    <div className="prefooter-wrapper">
      <motion.section
        className="get-started"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <h2>Ready to Transform Your Classroom?</h2>
        <p>Join thousands of educators delivering secure, interactive learning experiences.</p>
        <Link to="/register" className="btn-primary cta-btn">Get Started for Free</Link>
      </motion.section>

      <section className="integration-section">
        <div className="integration-content">
          <motion.div
            className="integration-card"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="icon-badge">
              <img src={formIcon} alt="Legacy Sync" className="integration-icon" />
            </div>
            <h3>Seamless Integration</h3>
            <p>
              Effortlessly sync with your existing tools. Import logic from
              <strong> Google Forms</strong> or <strong>Microsoft Surveys</strong> in seconds.
            </p>
          </motion.div>

          <motion.div
            className="integration-card highlight-card"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="icon-badge">
              <img src={dashIcon} alt="Live Dashboard" className="integration-icon" />
            </div>
            <h3>Real-Time Insights</h3>
            <p>
              Track student progress live. Our <strong>Admin Dashboard</strong> gives you
              instant feedback on attendance and exam integrity.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PreFooter;