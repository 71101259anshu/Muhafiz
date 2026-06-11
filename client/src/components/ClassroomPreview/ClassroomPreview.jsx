import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChalkboardTeacher, FaUserGraduate, FaClipboardCheck, FaVideo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './ClassroomPreview.css';

// Mock announcements data for the interactive Notice Board
const noticesData = [
    {
        id: 1,
        title: "Mid-Term Exams Schedule Published",
        category: "Exam",
        date: "June 12, 2026",
        sender: "Office of Dean (Academics)",
        content: "The mid-term examinations for all undergraduate and postgraduate programs are scheduled to commence from June 20, 2026. Detailed timetables for individual departments have been posted on their respective portal pages. Please ensure you have completed your biometric registrations prior to the exam dates as attendance checks will be mandatory at the hall entrances.",
        attachment: "midterm_schedule_2026.pdf"
    },
    {
        id: 2,
        title: "Mandatory Biometric Registration Deadline",
        category: "Urgent",
        date: "June 11, 2026",
        sender: "AI Proctoring Committee",
        content: "Attention students! The final deadline for completing your face-profile registration for biometric attendance is June 15, 2026. Failure to upload a clear face scan in your dashboard before this date will block your access to proctored online tests. If you face any issues, please contact the IT Helpdesk.",
        attachment: "biometric_guide.pdf"
    },
    {
        id: 3,
        title: "Scheduled Classroom Server Maintenance",
        category: "System",
        date: "June 09, 2026",
        sender: "IT Infrastructure Division",
        content: "The Kvizroom Classroom platform will undergo a scheduled system upgrade and database maintenance on Sunday, June 14, 2026, between 02:00 AM and 04:00 AM IST. The website and proctoring services will be temporarily unavailable during this period. We apologize for any inconvenience caused.",
        attachment: null
    },
    {
        id: 4,
        title: "Zoom & Jitsi Integrations Now Live",
        category: "General",
        date: "June 08, 2026",
        sender: "E-Learning Team",
        content: "We are thrilled to announce that native live class integrations for Zoom and Jitsi are now fully integrated and live. Teachers can schedule lectures directly within their classwork streams. Students will be able to join directly from their class dashboards without requiring external credentials.",
        attachment: "video_classes_guide.pdf"
    },
    {
        id: 5,
        title: "Summer Internship Portal Open",
        category: "Events",
        date: "June 06, 2026",
        sender: "Training & Placement Cell",
        content: "Applications are invited for the Summer Industry Internship Program 2026. Over 40 partner companies are offering positions in software development, data science, and business analytics. The application portal closes on June 18, 2026. Submit your resume through the dashboard tab.",
        attachment: "internship_details.pdf"
    }
];

const ClassroomPreview = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeNotice, setActiveNotice] = useState(null);

    const features = [
        {
            id: 0,
            title: "Smart Classroom Management",
            desc: "Organize classes, students, and curriculum in one intuitive dashboard. Create assignments and announcements with a single click.",
            icon: <FaChalkboardTeacher />
        },
        {
            id: 1,
            title: "Biometric Attendance",
            desc: "Eliminate proxy attendance with AI-powered face verification. Secure, fast, and completely automated attendance tracking.",
            icon: <FaUserGraduate />
        },
        {
            id: 2,
            title: "Proctored Exams",
            desc: "Conduct secure online exams with tab-switch monitoring and real-time proctoring alerts. Ensure integrity in every test.",
            icon: <FaClipboardCheck />
        },
        {
            id: 3,
            title: "Live Video Classes",
            desc: "Integrate with Jitsi/Zoom for seamless live classes directly within your course stream. No extra logins required.",
            icon: <FaVideo />
        }
    ];

    // Filter notices by both search query and selected category tab
    const filteredNotices = noticesData.filter(notice => {
        const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
        const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              notice.sender.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <section className="classroom-preview-section">
            <div className="preview-container">
                <div className="preview-header">
                    <h2>Experience the Learning with Kvizroom</h2>
                    <p>Everything you need to manage your institution, teachers, and students in one place.</p>
                </div>

                <div className="preview-content">
                    {/* Left side: Feature explanation cards */}
                    <div className="feature-list">
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`feature-item ${activeFeature === index ? 'active' : ''}`}
                                onMouseEnter={() => setActiveFeature(index)}
                                onClick={() => setActiveFeature(index)}
                            >
                                <div className="feature-icon">{feature.icon}</div>
                                <div className="feature-text">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right side: Interactive Campus Notice Board */}
                    <div className="feature-visual notice-board-container">
                        <div className="notice-board-header">
                            <div className="notice-board-title-row">
                                <span className="notice-bell-icon">🔔</span>
                                <h3>Campus Announcements</h3>
                            </div>
                            
                            {/* Search bar */}
                            <input 
                                type="text" 
                                placeholder="Search announcements..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="notice-search-input"
                            />

                            {/* Category Filter Tabs */}
                            <div className="notice-tabs">
                                {["All", "Urgent", "Exam", "System", "General", "Events"].map((cat) => (
                                    <button
                                        key={cat}
                                        className={`notice-tab ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Announcements List */}
                        <div className="notices-list">
                            {filteredNotices.length > 0 ? (
                                filteredNotices.map((notice) => (
                                    <div 
                                        key={notice.id} 
                                        className={`notice-item category-${notice.category.toLowerCase()}`}
                                        onClick={() => setActiveNotice(notice)}
                                    >
                                        <div className="notice-item-header">
                                            <span className={`notice-badge badge-${notice.category.toLowerCase()}`}>
                                                {notice.category}
                                            </span>
                                            <span className="notice-item-date">{notice.date}</span>
                                        </div>
                                        <h4 className="notice-item-title">{notice.title}</h4>
                                        <p className="notice-item-snippet">
                                            {notice.content.substring(0, 85)}...
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="no-notices">
                                    <span className="no-notices-icon">🔍</span>
                                    <p>No announcements match your search filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Announcement Details Modal Overlay */}
            <AnimatePresence>
                {activeNotice && (
                    <div className="notice-modal-overlay" onClick={() => setActiveNotice(null)}>
                        <motion.div 
                            className="notice-modal-content"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button className="notice-modal-close" onClick={() => setActiveNotice(null)}>&times;</button>
                            <div className="notice-modal-header">
                                <span className={`notice-badge badge-${activeNotice.category.toLowerCase()}`}>
                                    {activeNotice.category}
                                </span>
                                <span className="notice-modal-date">{activeNotice.date}</span>
                            </div>
                            <h2 className="notice-modal-title">{activeNotice.title}</h2>
                            <p className="notice-modal-sender">From: <strong>{activeNotice.sender}</strong></p>
                            <div className="notice-modal-divider"></div>
                            <p className="notice-modal-body">{activeNotice.content}</p>
                            
                            {activeNotice.attachment && (
                                <div className="notice-modal-attachment">
                                    <span className="attachment-icon">📄</span>
                                    <span className="attachment-name">{activeNotice.attachment}</span>
                                    <button 
                                        className="attachment-download-btn"
                                        onClick={() => toast.success(`Mock download started for ${activeNotice.attachment}!`)}
                                    >
                                        Download PDF
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default ClassroomPreview;
