import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios'; // Moved to top
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaClipboardList, FaUserShield } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ClassCard from '../components/ClassCard';
import { AuthContext } from '../context/AuthContext';
import './ClassroomDashboard.css';

const ClassroomDashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/classes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClasses(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchClasses();
    }, []);

    const toggleMenu = () => setShowMenu(!showMenu);

    const removeClass = async (classId) => {
        if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/classes/${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClasses(classes.filter(c => c.id !== classId));
                toast.success('Class deleted successfully');
            } catch (err) {
                console.error(err);
                toast.error('Failed to delete class');
            }
        }
    };

    return (
        <div className="classroom-dashboard">
            <div className="dashboard-header">
                {/* ...header content... */}
                <h1>Classroom</h1>
                <div className="action-container">
                    {user?.role === 'admin' && (
                        <div className="admin-quick-actions">
                            <button className="quick-btn" onClick={() => navigate('/create-test')} title="Create Quiz">
                                <FaClipboardList /> <span>Create Quiz</span>
                            </button>
                            <button className="quick-btn" onClick={() => navigate('/admin')} title="Admin Stats">
                                <FaUserShield /> <span>Dashboard</span>
                            </button>
                        </div>
                    )}

                    <button className="add-btn" onClick={toggleMenu} aria-label="Create or Join Class">
                        <FaPlus />
                    </button>
                    {showMenu && (
                        <div className="dropdown-menu">
                            <div className="menu-item" onClick={() => navigate('/join-class')}>
                                Join Class
                            </div>
                            {user?.role === 'admin' && (
                                <div className="menu-item" onClick={() => navigate('/create-class')}>
                                    Create Class
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {classes.length === 0 ? (
                <div className="empty-state">
                    <img src="https://cdni.iconscout.com/illustration/premium/thumb/online-learning-4213944-3501715.png" alt="No classes" className="empty-img" />
                    <h3>No classes yet!</h3>
                    <p>{user?.role === 'admin' ? 'Create a class to get started.' : 'Join a class to get started.'}</p>
                </div>
            ) : (
                <div className="class-grid">
                    {classes.map(cls => (
                        <ClassCard
                            key={cls.id}
                            classData={cls}
                            currentUser={user}
                            onDelete={removeClass}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClassroomDashboard;
