import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Features.css';
import { FaShieldAlt, FaBrain, FaChartLine, FaRobot, FaUserGraduate, FaChalkboardTeacher, FaMobileAlt, FaBolt } from 'react-icons/fa';

const Features = () => {
  const [activeRole, setActiveRole] = useState('admin'); // 'admin' or 'student'

  const features = {
    admin: [
      {
        icon: <FaShieldAlt />,
        title: "Smart Proctoring",
        desc: "AI detects suspicious behavior like tab switching, multiple faces, and voice activity."
      },
      {
        icon: <FaChalkboardTeacher />,
        title: "Class Management",
        desc: "Organize sections, track attendance biometrically, and manage curriculum in one place."
      },
      {
        icon: <FaChartLine />,
        title: "Deep Analytics",
        desc: "Visual reports on class performance, attendance trends, and individual student progress."
      },
      {
        icon: <FaRobot />,
        title: "Automated Grading",
        desc: "Save hours with instant grading for quizzes and automated report generation."
      }
    ],
    student: [
      {
        icon: <FaMobileAlt />,
        title: "Anywhere Access",
        desc: "Take quizzes and attend classes from any device with a unified, mobile-friendly interface."
      },
      {
        icon: <FaBolt />,
        title: "Instant Results",
        desc: "Get immediate feedback on your quiz submissions and track your improvement over time."
      },
      {
        icon: <FaUserGraduate />,
        title: "Student Dashboard",
        desc: "View all your upcoming assignments, attendance records, and class announcements in one hub."
      },
      {
        icon: <FaBrain />,
        title: "Adaptive Learning",
        desc: "Experience personalized quizzes that adapt to your learning pace and knowledge level."
      }
    ]
  };

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2>Tailored for Everyone</h2>
          <p>
            Whether you are <span style={{ color: '#2CB1BC', fontWeight: '600' }}>managing a classroom</span> or <span style={{ color: '#F59E0B', fontWeight: '600' }}>learning in a classroom</span>
          </p>

          <div className="role-toggle-container">
            <button
              className={`role-toggle-btn ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              For Admins & Teachers
            </button>
            <button
              className={`role-toggle-btn ${activeRole === 'student' ? 'active' : ''}`}
              onClick={() => setActiveRole('student')}
            >
              For Students
            </button>
          </div>
        </div>

        <div className="features-grid">
          <AnimatePresence mode="wait">
            {features[activeRole].map((feature, index) => (
              <motion.div
                key={`${activeRole}-${index}`}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -10 }}
              >
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Features;
