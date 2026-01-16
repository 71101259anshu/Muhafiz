
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaClipboardList, FaFileAlt, FaPlus, FaTimes, FaTrash, FaEdit, FaDownload } from 'react-icons/fa';
import './Classwork.css';
import { AuthContext } from '../../context/AuthContext';

const Classwork = ({ classId, filterType, className }) => { // Accept filterType: 'assignment' | 'material'
    const { user } = useContext(AuthContext);
    const [classworkList, setClassworkList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topic, setTopic] = useState('');
    const [type, setType] = useState(filterType || 'assignment'); // Default to filterType
    const [dueDate, setDueDate] = useState('');
    const [maxGrade, setMaxGrade] = useState(100);
    const [editingId, setEditingId] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);

    // Submission State (Student)
    const [mySubmission, setMySubmission] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Grading State (Teacher/Admin)
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [gradingSubmission, setGradingSubmission] = useState(null); // The submission currently being graded
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');

    // Update type when filterType changes
    useEffect(() => {
        if (filterType) setType(filterType);
    }, [filterType]);

    const fetchClasswork = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/classwork/${classId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter list based on filterType
            let data = res.data;
            if (filterType) {
                data = data.filter(item => item.type === filterType);
            }

            setClassworkList(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [classId, filterType]);

    useEffect(() => {
        fetchClasswork();
    }, [fetchClasswork]); // Re-fetch/re-filter when prop changes

    // ... (rest of state)

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Check if editing or creating
            if (editingId) {
                // UPDATE
                // We'll send JSON for update to keep it simple, or FormData if we wanted file updates (skipping file updates for now as per requirement focus on deadline)
                // Actually, let's just stick to JSON for deadline/details update as multer logic might need tweaks for optional file replacement
                const payload = {
                    title,
                    description,
                    topic,
                    dueDate,
                    maxGrade
                };

                await axios.put(`/api/classwork/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Updated successfully');
            } else {
                // CREATE
                const formData = new FormData();
                formData.append('classId', classId);
                formData.append('title', title);
                formData.append('description', description);
                formData.append('type', filterType || type);
                formData.append('topic', topic);
                if (dueDate) formData.append('dueDate', dueDate);
                formData.append('maxGrade', maxGrade);
                if (selectedFile) formData.append('file', selectedFile);

                await axios.post('/api/classwork', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Reset and Refresh
            setShowCreateModal(false);
            setEditingId(null); // Reset edit mode
            setTitle('');
            setDescription('');
            setTopic('');
            setDueDate('');
            maxGrade && setMaxGrade(100);
            setSelectedFile(null);
            fetchClasswork();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to save classwork');
        }
    };

    const handleEditClick = (item) => {
        setEditingId(item._id);
        setTitle(item.title);
        setDescription(item.description || '');
        setTopic(item.topic || '');
        // Format date for datetime-local: YYYY-MM-DDTHH:mm
        if (item.dueDate) {
            const d = new Date(item.dueDate);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // adjust for local time 
            setDueDate(d.toISOString().slice(0, 16));
        } else {
            setDueDate('');
        }
        setMaxGrade(item.maxGrade || 100);
        setType(item.type);
        setShowCreateModal(true);
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/classwork/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove from list immediately
            setClassworkList(prev => prev.filter(i => i._id !== itemId));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete item');
        }
    };

    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const scrollToTopic = (topicName) => {
        const element = document.getElementById(`topic-${topicName}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const fetchMySubmission = async (classworkId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/classwork/${classworkId}/my-submission`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMySubmission(res.data);
        } catch (err) {
            // 404 is expected if no submission yet
            if (err.response?.status !== 404) console.error(err);
            setMySubmission(null);
        }
    };

    const handleTurnIn = async (classworkId) => {
        try {
            setUploading(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();
            if (submissionFile) {
                // Handle multiple files if needed, currently single for simplicity or loop
                // The backend supports array, so let's send 'files'
                formData.append('files', submissionFile);
            }

            await axios.post(`/api/classwork/${classworkId}/submit`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Assignment turned in!');
            setUploading(false);
            setSubmissionFile(null);
            fetchMySubmission(classworkId); // Refresh status
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to turn in assignment');
            setUploading(false);
        }
    };

    const handleUnsubmit = async (classworkId) => {
        if (!window.confirm("Are you sure you want to unsubmit?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/classwork/${classworkId}/unsubmit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Unsubmitted successfully. You can now edit and resubmit.');
            fetchMySubmission(classworkId); // Should reset state to null
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to unsubmit');
        }
    };

    // Teacher/Admin Grading Logic
    const openGradingModal = async (classworkId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/classwork/${classworkId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(res.data);
            setShowGradingModal(true);
        } catch (err) {
            console.error(err);
            alert('Failed to load submissions');
        }
    };

    const handleGrade = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/classwork/submissions/${gradingSubmission._id}`, { grade, feedback }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setSubmissions(prev => prev.map(sub =>
                sub._id === gradingSubmission._id ? { ...sub, grade, feedback, status: 'graded' } : sub
            ));
            setGradingSubmission(null); // Close grading view for specific student, return to list
            alert('Grade saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save grade');
        }
    };

    // When expanding an assignment as a student, fetch submission status
    useEffect(() => {
        if (expandedId && user?.role === 'student') {
            const item = classworkList.find(i => i._id === expandedId);
            if (item && item.type === 'assignment') {
                fetchMySubmission(expandedId);
            }
        }
    }, [expandedId, classworkList, user]);

    // ... (fetch logic remains same) ...

    // Group items by topic
    const groupedClasswork = classworkList.reduce((acc, item) => {
        const topicName = item.topic || 'General';
        if (!acc[topicName]) acc[topicName] = [];
        acc[topicName].push(item);
        return acc;
    }, {});

    // Filter assignments due within 24 hours AND not submitted
    const dueSoonAssignments = classworkList.filter(item => {
        if (item.type !== 'assignment' || !item.dueDate) return false;
        if (item.isSubmitted) return false; // Exclude if already submitted

        const due = new Date(item.dueDate);
        const now = new Date();
        const diff = due - now;
        return diff > 0 && diff < 86400000; // 24 hours
    });

    const createButtonText = 'New';

    if (loading) return <div className="loading-cw">Loading...</div>;

    // For Teachers: Filter assignments with ungraded submissions
    const pendingAssessmentList = user?.role === 'admin'
        ? classworkList.filter(item => item.ungradedCount > 0)
        : [];

    return (
        <div className="classwork-container">
            {/* ... Sidebar ... */}
            <div className="sidebar">
                {/* Student: Due Soon View */}
                {user?.role === 'student' && dueSoonAssignments.length > 0 && (
                    <div className="due-soon-sidebar">
                        <h3 className="due-soon-title">Due Soon!</h3>
                        <ul>
                            {dueSoonAssignments.map(item => (
                                <li
                                    key={item._id}
                                    onClick={() => {
                                        if (expandedId !== item._id) toggleExpand(item._id);
                                        setTimeout(() => {
                                            document.getElementById(`item-${item._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 100);
                                    }}
                                    className="due-soon-link"
                                >
                                    {item.title}
                                </li>
                            ))}
                        </ul>
                        <hr style={{ margin: '1rem 0', borderTop: '1px solid #e2e8f0' }} />
                    </div>
                )}

                {/* Teacher: Pending Assessment View */}
                {user?.role === 'admin' && pendingAssessmentList.length > 0 && (
                    <div className="due-soon-sidebar">
                        <h3 className="due-soon-title">Pending Assessment</h3> {/* Requirement says 'Pending Assess' but 'Assess' sounds weird as title, maybe 'To Grade'? Sticking to user words or slightly better 'Pending Review' */}
                        <ul>
                            {pendingAssessmentList.map(item => (
                                <li
                                    key={item._id}
                                    onClick={() => {
                                        if (expandedId !== item._id) toggleExpand(item._id);
                                        setTimeout(() => {
                                            document.getElementById(`item-${item._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 100);
                                    }}
                                    className="due-soon-link"
                                >
                                    {item.title} <span style={{ fontSize: '0.8em', color: '#718096' }}>({item.ungradedCount})</span>
                                </li>
                            ))}
                        </ul>
                        <hr style={{ margin: '1rem 0', borderTop: '1px solid #e2e8f0' }} />
                    </div>
                )}

                <h3>Topics</h3>
                <ul>
                    {Object.keys(groupedClasswork).map(t => (
                        <li key={t} onClick={() => scrollToTopic(t)}>{t}</li>
                    ))}
                </ul>
            </div>

            <div className="content">
                {/* Create Button */}
                {(user?.role === 'admin') && (
                    <div className="create-btn-container">
                        <button className="create-work-btn" onClick={() => setShowCreateModal(true)}>
                            <FaPlus /> {createButtonText}
                        </button>
                    </div>
                )}

                {Object.keys(groupedClasswork).length === 0 && <p className="no-work">No {filterType}s posted yet.</p>}

                {Object.entries(groupedClasswork).map(([topicName, items]) => (
                    <div key={topicName} id={`topic-${topicName}`} className="topic-section">
                        <h2 className="topic-title">{topicName}</h2>
                        <div className="topic-items">
                            {items.map(item => {
                                const isExpanded = expandedId === item._id;
                                return (
                                    <div
                                        key={item._id}
                                        id={`item-${item._id}`}
                                        className={`classwork-item ${isExpanded ? 'expanded' : ''}`}
                                        onClick={() => toggleExpand(item._id)}
                                    >
                                        <div className="item-header">
                                            <div className={`item-icon ${item.type}`}>
                                                {item.type === 'assignment' ? <FaClipboardList /> : <FaFileAlt />}
                                            </div>
                                            <span className="item-title">{item.title}</span>

                                            {/* Date shown on right in collapsed view if space permits, or hide */}

                                        </div>

                                        {isExpanded && (
                                            <div className="item-body" onClick={e => e.stopPropagation()}>
                                                <div className="item-content-left">
                                                    <div className="item-top-header">
                                                        <span className={`item-date ${item.type === 'assignment' && item.dueDate && (new Date(item.dueDate) - new Date() < 86400000) && (new Date(item.dueDate) - new Date() > 0)
                                                            ? 'due-soon'
                                                            : ''
                                                            }`}>
                                                            {item.type === 'assignment' && item.dueDate
                                                                ? `Due ${new Date(item.dueDate).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                                                : `Posted ${new Date(item.createdAt).toLocaleDateString()}`}
                                                        </span>

                                                        {(user?.role === 'admin') && (
                                                            <div className="admin-actions" style={{ display: 'flex', gap: '10px' }}>
                                                                {item.type === 'assignment' && (
                                                                    <button
                                                                        className="action-icon-btn view-submissions"
                                                                        onClick={(e) => { e.stopPropagation(); openGradingModal(item._id); }}
                                                                        title="View Submissions"
                                                                        style={{ background: 'none', border: 'none', color: '#4a90e2', cursor: 'pointer' }}
                                                                    >
                                                                        <FaClipboardList />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="action-icon-btn edit"
                                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                                    title="Edit"
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    className="action-icon-btn delete"
                                                                    onClick={(e) => handleDelete(item._id)}
                                                                    title="Delete"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {item.description && (
                                                        <div className="item-description">
                                                            <span style={{ fontWeight: '600', color: '#2d3748', marginRight: '5px' }}>Note:</span>
                                                            {item.description}
                                                        </div>
                                                    )}
                                                    {/* ... */}


                                                    {item.attachments && item.attachments.length > 0 && (
                                                        <div className="item-attachments">
                                                            {item.attachments.map((file, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="attachment-card"
                                                                    title={file.name}
                                                                >
                                                                    <div className="file-preview-icon"><FaFileAlt /></div>
                                                                    <div className="file-info">
                                                                        <span className="file-name">{file.name}</span>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Student Submission Section */}
                                                {user?.role === 'student' && item.type === 'assignment' && (
                                                    <div className="student-submission-section">
                                                        <h4>Your Work</h4>
                                                        <div className="submission-status">
                                                            Status: <strong>
                                                                {mySubmission ? (mySubmission.status === 'graded' ? `Graded: ${mySubmission.grade}/${item.maxGrade || 100}` : 'Turned In') : 'Assigned'}
                                                            </strong>
                                                        </div>

                                                        {mySubmission ? (
                                                            <div className="submission-details">
                                                                {mySubmission.attachments && mySubmission.attachments.map((file, idx) => (
                                                                    <div key={idx} className="submitted-file">
                                                                        <FaFileAlt /> {file.name}
                                                                    </div>
                                                                ))}
                                                                {mySubmission.feedback && (
                                                                    <div className="teacher-feedback">
                                                                        <strong>Feedback:</strong> {mySubmission.feedback}
                                                                    </div>
                                                                )}
                                                                {mySubmission.status !== 'graded' && (
                                                                    <button
                                                                        className="unsubmit-btn"
                                                                        onClick={() => handleUnsubmit(item._id)}
                                                                        style={{ marginTop: '1rem', background: '#e53e3e', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: '600' }}
                                                                    >
                                                                        Unsubmit
                                                                    </button>
                                                                )}
                                                                {mySubmission.status === 'graded' && <button className="turned-in-btn" disabled>Graded</button>}
                                                                {mySubmission.status === 'submitted' && <button className="turned-in-btn" disabled>Turned In</button>}
                                                            </div>
                                                        ) : (
                                                            <div className="turn-in-area">
                                                                <label className="submission-input">
                                                                    <span>{submissionFile ? submissionFile.name : '+ Add or create'}</span>
                                                                    <input
                                                                        type="file"
                                                                        style={{ display: 'none' }}
                                                                        onChange={e => setSubmissionFile(e.target.files[0])}
                                                                    />
                                                                </label>
                                                                <button
                                                                    className="turn-in-btn"
                                                                    onClick={() => handleTurnIn(item._id)}
                                                                    disabled={uploading}
                                                                >
                                                                    {uploading ? 'Turning in...' : 'Turn In'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingId ? (type === 'assignment' ? 'Edit Assignment' : 'Edit Classwork') : (className || 'Create Classwork')}</h3>
                            <button onClick={() => { setShowCreateModal(false); setEditingId(null); setMaxGrade(100); setTitle(''); setDescription(''); setTopic(''); setDueDate(''); setSelectedFile(null); }}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
                            <div className="form-row">
                                {!filterType && <select value={type} onChange={e => setType(e.target.value)}><option value="assignment">Assignment</option><option value="material">Material</option></select>}
                                <input type="text" placeholder="Topic (e.g. Week 1)" value={topic} onChange={e => setTopic(e.target.value)} />
                            </div>
                            {type === 'assignment' && (
                                <div className="form-row">
                                    <div style={{ flex: 1 }}>
                                        <label>Due Date:</label>
                                        <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <label>Max Grade:</label>
                                        <input type="number" value={maxGrade} onChange={e => setMaxGrade(e.target.value)} min="1" />
                                    </div>
                                </div>
                            )}
                            <div className="form-row"><input type="file" onChange={e => setSelectedFile(e.target.files[0])} /></div>
                            <button type="submit" className="submit-cw-btn">{editingId ? 'Update' : 'Assign'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Grading Modal */}
            {showGradingModal && (
                <div className="modal-overlay">
                    <div className="modal-content grading-modal">
                        <div className="modal-header">
                            <h3>Submissions</h3>
                            <button onClick={() => { setShowGradingModal(false); setGradingSubmission(null); }}><FaTimes /></button>
                        </div>

                        {!gradingSubmission ? (
                            <div className="submissions-list">
                                {submissions.length === 0 ? <p>No submissions yet.</p> : (
                                    <ul>
                                        {submissions.map((sub, idx) => (
                                            <li key={sub._id || `student-${sub.student?._id}-${idx}`} className="submission-item" onClick={() => { if (sub.status !== 'not submitted') { setGradingSubmission(sub); setGrade(sub.grade || ''); setFeedback(sub.feedback || ''); } }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px', cursor: sub.status === 'not submitted' ? 'default' : 'pointer', opacity: sub.status === 'not submitted' ? 0.6 : 1 }}>
                                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', flex: 1 }}>
                                                    <img
                                                        src={sub.student?.photo || "https://ideogram.ai/assets/image/lossless/response/8c4O_k-aQ-qh2kDQ5jWnOA"}
                                                        alt="avatar"
                                                        className="avatar-small"
                                                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://ideogram.ai/assets/image/lossless/response/8c4O_k-aQ-qh2kDQ5jWnOA"; }}
                                                    />
                                                    <span className="student-name" style={{ fontWeight: 600, color: '#2d3748', whiteSpace: 'nowrap' }}>{sub.student?.username || 'Unknown Student'}</span>
                                                    <span className={`status-badge ${sub.status.replace(' ', '-')}`} style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', textTransform: 'capitalize', marginLeft: '10px', whiteSpace: 'nowrap' }}>{sub.status}</span>

                                                    {/* Score aligned before the button */}
                                                    {sub.status === 'graded' && sub.grade !== undefined && (
                                                        <span className="submission-score" style={{ fontWeight: '600', color: '#2b6cb0', marginLeft: 'auto', marginRight: '20px' }}>
                                                            {sub.grade}/{classworkList.find(c => c._id === sub.classwork)?.maxGrade || 100}
                                                        </span>
                                                    )}
                                                </div>
                                                <button className="view-sub-btn" disabled={sub.status === 'not submitted'} style={{ marginLeft: (sub.status === 'graded' && sub.grade !== undefined) ? '0' : 'auto', opacity: sub.status === 'not submitted' ? 0.5 : 1, cursor: sub.status === 'not submitted' ? 'not-allowed' : 'pointer' }}>View</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div className="grading-view">
                                <button className="back-btn" onClick={() => setGradingSubmission(null)}>← Back to List</button>
                                <h4>Grading: {gradingSubmission.student?.username}</h4>

                                <div className="student-files">
                                    {gradingSubmission.attachments.map((file, idx) => {
                                        const isDoc = /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(file.name);
                                        const fileUrl = isDoc
                                            ? `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=false`
                                            : file.url;

                                        return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="file-link" style={{ flex: 1 }}>
                                                    <FaFileAlt /> {file.name}
                                                </a>
                                                <a href={file.url} download target="_blank" rel="noopener noreferrer" title="Download" style={{ color: '#4a90e2', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f7fafc', display: 'flex', alignItems: 'center' }}>
                                                    <FaDownload />
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>

                                <form onSubmit={handleGrade}>
                                    <div className="form-group">
                                        <label>Grade (out of {classworkList.find(c => c._id === submissions[0]?.classwork)?.maxGrade || 100})</label>
                                        <input
                                            type="number"
                                            value={grade}
                                            onChange={e => setGrade(e.target.value)}
                                            max={classworkList.find(c => c._id === submissions[0]?.classwork)?.maxGrade || 100}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Feedback</label>
                                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows="3"></textarea>
                                    </div>
                                    <button type="submit" className="save-grade-btn">Save & Return</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Classwork;
