import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaUserCircle } from 'react-icons/fa';
import './People.css';
import { AuthContext } from '../../context/AuthContext';

const People = ({ classId }) => {
    const { user } = useContext(AuthContext);
    const [teacher, setTeacher] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/classes/${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeacher(res.data.teacher);
                setStudents(res.data.students);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchPeople();
    }, [classId]);

    const handleRemoveStudent = async (studentId, studentName) => {
        if (!window.confirm(`Are you sure you want to remove ${studentName}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/classes/${classId}/remove-student`, { studentId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(prev => prev.filter(s => s._id !== studentId));
            alert(`${studentName} has been removed from the class.`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to remove student');
        }
    };

    if (loading) return <div className="loading-people">Loading people...</div>;

    return (
        <div className="people-container">
            <section className="people-section">
                <h2>Teachers</h2>
                {teacher && (
                    <div className="person-row">
                        <div className="person-info">
                            <div className="person-avatar">
                                {teacher.photo ? (
                                    <img src={teacher.photo} alt={teacher.username} />
                                ) : (
                                    <FaUserCircle />
                                )}
                            </div>
                            <div className="person-details">
                                <span className="person-name">{teacher.username}</span>
                                <span className="person-email">{teacher.email}</span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section className="people-section">
                <div className="section-header">
                    <h2>Students</h2>
                    <span className="count">{students.length} students</span>
                </div>
                {students.length === 0 ? (
                    <p className="no-students">No students have joined yet.</p>
                ) : (
                    students.map(s => (
                        <div key={s._id} className="person-row">
                            <div className="person-info">
                                <div className="person-avatar">
                                    {s.photo ? (
                                        <img src={s.photo} alt={s.username} />
                                    ) : (
                                        <FaUserCircle />
                                    )}
                                </div>
                                <div className="person-details">
                                    <span className="person-name">{s.username}</span>
                                    <span className="person-email">{s.email}</span>
                                </div>
                            </div>
                            {/* Only show remove button for admin */}
                            {user?.role === 'admin' && (
                                <button
                                    className="remove-student-btn"
                                    onClick={() => handleRemoveStudent(s._id, s.username)}
                                    style={{ padding: '6px 12px', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))
                )}
            </section>
        </div>
    );
};

export default People;
