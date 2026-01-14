import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChalkboardTeacher, FaUserGraduate, FaClipboardCheck, FaVideo, FaQuoteLeft } from 'react-icons/fa';
import './ClassroomPreview.css';

const ClassroomPreview = () => {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            id: 0,
            title: "Smart Classroom Management",
            desc: "Organize classes, students, and curriculum in one intuitive dashboard. Create assignments and announcements with a single click.",
            icon: <FaChalkboardTeacher />,
            quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
            author: "Mahatma Gandhi"
        },
        {
            id: 1,
            title: "Biometric Attendance",
            desc: "Eliminate proxy attendance with AI-powered face verification. Secure, fast, and completely automated attendance tracking.",
            icon: <FaUserGraduate />,
            quote: "Education is the manifestation of the perfection already in man.",
            author: "Swami Vivekananda"
        },
        {
            id: 2,
            title: "Proctored Exams",
            desc: "Conduct secure online exams with tab-switch monitoring and real-time proctoring alerts. Ensure integrity in every test.",
            icon: <FaClipboardCheck />,
            quote: "Technology is just a tool. In terms of getting the kids working together and motivating them, the teacher is the most important.",
            author: "Bill Gates"
        },
        {
            id: 3,
            title: "Live Video Classes",
            desc: "Integrate with Jitsi/Zoom for seamless live classes directly within your course stream. No extra logins required.",
            icon: <FaVideo />,
            quote: "It is important to view knowledge as sort of a semantic tree -- make sure you understand the fundamental principles before you get into the leaves.",
            author: "Elon Musk"
        }
    ];

    return (
        <section className="classroom-preview-section">
            <div className="preview-container">
                <div className="preview-header">
                    <h2>Experience the Learning with Kvizroom</h2>
                    <p>Everything you need to manage your institution, teachers, and students in one place.</p>
                </div>

                <div className="preview-content">
                    <div className="feature-list">
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`feature-item ${activeFeature === index ? 'active' : ''}`}
                                onMouseEnter={() => setActiveFeature(index)}
                            >
                                <div className="feature-icon">{feature.icon}</div>
                                <div className="feature-text">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="feature-visual">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeFeature}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.4 }}
                                className="quote-card"
                            >
                                {/* Decorative Icon */}
                                <div className="quote-icon-bg">
                                    <FaQuoteLeft />
                                </div>

                                <h3 className="quote-text">
                                    "{features[activeFeature].quote.replace(/"/g, '')}"
                                </h3>

                                <span className="quote-author">
                                    - {features[activeFeature].author}
                                </span>
                            </motion.div>
                        </AnimatePresence>

                        <div className="visual-badge">
                            Inspiration
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ClassroomPreview;
