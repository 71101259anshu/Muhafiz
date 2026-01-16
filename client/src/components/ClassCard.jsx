import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// ... imports
import { FaChalkboardTeacher, FaUsers, FaTrash } from 'react-icons/fa';
import './ClassCard.css';

const ClassCard = ({ classData, currentUser, onDelete }) => {
  const navigate = useNavigate();
  const { id, name, section, teacherName, teacherId, studentCount, bannerImage } = classData;

  // Generate a random gradient if no banner provided
  const gradient = bannerImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  const isCreator = String(currentUser?._id) === String(teacherId);

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent card click navigation
    onDelete(id);
  };

  return (
    <motion.div
      className="class-card glass-effect"
      onClick={() => navigate(`/class/${id}`)}
      whileHover={{ y: -5, boxShadow: '0 12px 20px rgba(0,0,0,0.1)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="class-card-header" style={{ background: gradient }}>
        <div className="class-info">
          <h3 className="class-name">{name}</h3>
          <p className="class-section">{section}</p>
        </div>
        <div className="class-teacher">
          {teacherName}
        </div>
        {isCreator && (
          <button
            className="delete-class-btn"
            onClick={handleDelete}
            title="Delete Class"
          >
            <FaTrash />
          </button>
        )}
      </div>
      <div className="class-card-body">
        <div className="class-stat">
          <FaUsers /> <span>{studentCount} Students</span>
        </div>
      </div>
      <div className="class-card-footer">
        <FaChalkboardTeacher title="Go to class" />
      </div>
    </motion.div>
  );
};

export default ClassCard;
