import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserPlus, FaTrashAlt, FaChalkboardTeacher, FaCalendarCheck, FaTable, FaClipboardList, FaEnvelope, FaEye, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ManageClassUsers.css';

const ManageClassUsers = () => {

    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [loading, setLoading] = useState(false);

    // Data States
    const [students, setStudents] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: status }
    const [gradebookData, setGradebookData] = useState({ columns: [], data: [] });

    // UI States
    const [activeTab, setActiveTab] = useState('users'); // users, attendance, grades
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedStudentForGrades, setSelectedStudentForGrades] = useState(null); // For drill-down view in grades
    const [newEmail, setNewEmail] = useState('');

    // Fetch Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('/api/classes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClasses(res.data);
            } catch (err) {
                toast.error("Failed to load classes");
            }
        };
        fetchClasses();
    }, []);

    // Fetch Class Data when Selected or Tab Changes
    useEffect(() => {
        if (!selectedClassId) return;

        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                if (activeTab === 'users') {
                    const res = await axios.get(`/api/classes/${selectedClassId}/members`, { headers });
                    setStudents(res.data.students || []);
                } else if (activeTab === 'attendance') {
                    // Fetch Students + Attendance for Date
                    const [resMembers, resAtt] = await Promise.all([
                        axios.get(`/api/classes/${selectedClassId}/members`, { headers }),
                        axios.get(`/api/classes/${selectedClassId}/attendance?date=${attendanceDate}`, { headers })
                    ]);
                    setStudents(resMembers.data.students || []);

                    // Map existing records to state
                    const records = {};
                    if (resAtt.data.records) {
                        resAtt.data.records.forEach(r => records[r.studentId] = r.status);
                    }
                    setAttendanceRecords(records);

                } else if (activeTab === 'grades') {
                    const res = await axios.get(`/api/classes/${selectedClassId}/gradebook`, { headers });
                    setGradebookData(res.data);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data");
            }
            setLoading(false);
        };

        fetchData();
    }, [selectedClassId, activeTab, attendanceDate]);


    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageData, setMessageData] = useState({ recipientId: '', recipientName: '', content: '' });

    const openMessageModal = (studentId, studentName) => {
        console.log("Opening private message modal for:", studentName);
        setMessageData({ recipientId: studentId, recipientName: studentName, content: '' });
        setShowMessageModal(true);
    };

    const submitMessage = async (e) => {
        e.preventDefault();
        if (!messageData.content.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('content', messageData.content);
            formData.append('classId', selectedClassId);
            formData.append('isPrivate', 'true');
            formData.append('recipient', messageData.recipientId);

            await axios.post('/api/posts', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Private message sent to ${messageData.recipientName}`);
            setShowMessageModal(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to send message");
        }
    };

    const handleClassChange = (e) => {
        setSelectedClassId(e.target.value);
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const saveAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const records = students.map(s => ({
                studentId: s._id,
                studentName: s.username,
                status: attendanceRecords[s._id] || 'Present'
            }));

            await axios.post(`/api/classes/${selectedClassId}/attendance`, {
                date: attendanceDate,
                records
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success("Attendance Saved!");
        } catch (err) {
            toast.error("Failed to save attendance");
        }
    };

    const removeStudent = async (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`/api/classes/${selectedClassId}/remove-student`,
                    { studentId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Update State
                setStudents(prev => prev.filter(s => s._id !== studentId));
                toast.success(`${studentName} removed from class.`);
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "Failed to remove student");
            }
        }
    };





    const addStudent = (e) => {
        e.preventDefault();
        toast.info("Invite functionality pending backend. Share class code instead.");
        setShowAddModal(false);
    };

    return (
        <div className="manage-class-users">
            <div className="page-header glass-panel">
                <h1>Classroom Manager</h1>
                <p>Manage students, track attendance, and view grades.</p>
            </div>

            <div className="class-selector-container">
                <label className="selector-label">
                    <FaChalkboardTeacher /> Select Classroom:
                </label>
                <select
                    className="class-select-dropdown"
                    value={selectedClassId}
                    onChange={handleClassChange}
                >
                    <option value="" disabled>-- Select a Class --</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name} ({cls.section})</option>
                    ))}
                </select>
            </div>

            {selectedClassId ? (
                <div className="management-tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <FaUsers /> Students
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                            onClick={() => setActiveTab('attendance')}
                        >
                            <FaCalendarCheck /> Attendance
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
                            onClick={() => setActiveTab('grades')}
                        >
                            <FaClipboardList /> Gradebook
                        </button>
                    </div>

                    <div className="tab-content glass-card">
                        {loading ? <p>Loading...</p> : (
                            <>
                                {/* === USERS TAB === */}
                                {activeTab === 'users' && (
                                    <div className="students-panel">
                                        <div className="panel-header">
                                            <h2>Students List ({students.length})</h2>
                                            {/* <button className="add-student-btn" onClick={() => setShowAddModal(true)}>
                                                <FaUserPlus /> Add Student
                                            </button> */}
                                            <div className="code-badge">
                                                Code: {classes.find(c => c.id === selectedClassId)?.code}
                                            </div>
                                        </div>
                                        <div className="students-grid">
                                            {students.length > 0 ? students.map(student => (
                                                <div key={student._id} className="student-card glass-card">
                                                    <div className="card-left">
                                                        <div className="avatar-circle-lg">
                                                            {student.username?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div className="student-details">
                                                            <span className="student-name">{student.username}</span>
                                                            <span className="student-email">{student.email}</span>
                                                        </div>
                                                    </div>
                                                    <div className="card-actions">
                                                        <button
                                                            className="action-icon message-btn"
                                                            onClick={() => openMessageModal(student._id, student.username)}
                                                            title="Send Private Message"
                                                        >
                                                            <FaEnvelope />
                                                        </button>
                                                        <button
                                                            className="action-icon delete-btn"
                                                            onClick={() => removeStudent(student._id, student.username)}
                                                            title="Remove Student"
                                                        >
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </div>
                                            )) : <p className="no-students">No students enrolled yet.</p>}
                                        </div>
                                    </div>
                                )}

                                {/* === ATTENDANCE TAB === */}
                                {activeTab === 'attendance' && (
                                    <div className="attendance-panel">
                                        <div className="attendance-controls">
                                            <div className="date-control-group">
                                                <label>Date:</label>
                                                <input
                                                    type="date"
                                                    value={attendanceDate}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                                />
                                                <button
                                                    className="today-btn"
                                                    onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}
                                                    title="Jump to Today"
                                                >
                                                    Today
                                                </button>
                                            </div>
                                            <button className="save-btn" onClick={saveAttendance}>Save Attendance</button>
                                        </div>
                                        <table className="attendance-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map(student => (
                                                    <tr key={student._id}>
                                                        <td>{student.username}</td>
                                                        <td>
                                                            <div className="status-options">
                                                                {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                                                                    <label key={status} className={`status-label ${status.toLowerCase()}`}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`att-${student._id}`}
                                                                            checked={(attendanceRecords[student._id] || 'Present') === status}
                                                                            onChange={() => handleAttendanceChange(student._id, status)}
                                                                        />
                                                                        {status}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* === GRADES TAB === */}
                                {activeTab === 'grades' && (
                                    <div className="grades-panel">
                                        {!selectedStudentForGrades ? (
                                            <div className="assignments-grid">
                                                {gradebookData.data.length > 0 ? gradebookData.data.map(student => (
                                                    <div key={student.id} className="assignment-card glass-card">
                                                        <div className="card-left">
                                                            <div className="avatar-circle-lg">
                                                                {student.name?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div className="student-details">
                                                                <span className="student-name">{student.name}</span>
                                                                <span className="student-email">{student.email}</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="view-btn icon-only"
                                                            onClick={() => setSelectedStudentForGrades(student)}
                                                            title="View Grades"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                    </div>
                                                )) : <p className="no-data-msg">No students enrolled.</p>}
                                            </div>
                                        ) : (
                                            /* === DETAIL VIEW (STUDENT GRADES) === */
                                            <div className="grade-detail-view">
                                                <div className="detail-header">
                                                    <button
                                                        className="back-btn-small icon-only-back"
                                                        onClick={() => setSelectedStudentForGrades(null)}
                                                        title="Back to Students"
                                                    >
                                                        <FaArrowLeft />
                                                    </button>
                                                    <h2>Grade Report: {selectedStudentForGrades.name}</h2>
                                                </div>

                                                <div className="grades-table-wrapper">
                                                    <table className="grades-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Assessment</th>
                                                                <th>Type</th>
                                                                <th>Grade / Score</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {gradebookData.columns.map(col => (
                                                                <tr key={col.id}>
                                                                    <td>{col.label}</td>
                                                                    <td><span className="type-badge">{col.type}</span></td>
                                                                    <td className="grade-cell">
                                                                        {selectedStudentForGrades.grades[col.id] || '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {gradebookData.columns.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No assignments or tests yet.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="select-prompt glass-card">
                    <p>Please select a classroom above to start managing.</p>
                </div>
            )}

            {showMessageModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3>Message to {messageData.recipientName}</h3>
                        <form onSubmit={submitMessage}>
                            <textarea
                                className="message-textarea"
                                placeholder="Write your private message here..."
                                value={messageData.content}
                                onChange={(e) => setMessageData({ ...messageData, content: e.target.value })}
                                rows="4"
                                autoFocus
                            ></textarea>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowMessageModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-btn">Send Message</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageClassUsers;
