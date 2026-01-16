import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { AuthContext } from '../context/AuthContext';
import { FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './ClassDetails.css';

// Sub-components
import Stream from './ClassTabs/Stream';
import Classwork from './ClassTabs/Classwork';
import People from './ClassTabs/People';

const ClassDetails = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('stream');
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQRCode, setShowQRCode] = useState(false);

    useEffect(() => {
        const fetchClassDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/classes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClassData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load class details');
                setLoading(false);
            }
        };
        fetchClassDetails();
    }, [id]);

    const copyCode = () => {
        navigator.clipboard.writeText(classData.code);
        alert('Class code copied to clipboard!');
    };

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleDeleteClass = async () => {
        if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/classes/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Class deleted successfully');
                navigate('/classroom');
            } catch (err) {
                console.error(err);
                toast.error('Failed to delete class');
            }
        }
    };

    if (loading) return <div className="loading-spinner">Loading Class...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const isCreator = (() => {
        if (!classData || !user) return false;

        // Handle teacher being an object or an ID string
        const teacherId = classData.teacher?._id || classData.teacher;

        // Handle user having _id (MongoDB) or id (normalized)
        const userId = user._id || user.id;

        return String(teacherId) === String(userId);
    })();

    return (
        <div className="class-details-container">
            <div className="class-header" style={{ background: classData.bannerImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="header-content">
                    <h1>{classData.name}</h1>
                    <p>{classData.section} • {classData.room}</p>
                </div>

                <div className="class-actions">
                    <div className="join-code-badge" onClick={copyCode} title="Click to copy">
                        Code: <strong>{classData.code}</strong>
                    </div>
                    <button className="qr-btn" onClick={() => setShowQRCode(!showQRCode)}>
                        {showQRCode ? 'Hide QR' : 'Show QR'}
                    </button>
                    {isCreator && (
                        <button className="qr-btn delete-btn-header" onClick={handleDeleteClass} title="Delete Class" style={{ background: 'rgba(220, 38, 38, 0.9)', marginLeft: '10px' }}>
                            <FaTrash />
                        </button>
                    )}
                </div>

                {showQRCode && (
                    <div className="qr-code-popup">
                        <div className="qr-content" onClick={(e) => e.stopPropagation()}>
                            <h3>Join "{classData.title}"</h3>
                            <div style={{ background: 'white', padding: '10px', display: 'inline-block' }}>
                                <QRCode
                                    value={`${window.location.origin}/join-class?code=${classData.code}`}
                                    size={180}
                                />
                            </div>
                            <p>Scan to get the Class Code: <strong>{classData.code}</strong></p>
                            <button onClick={() => setShowQRCode(false)}>Close</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="class-tabs">
                <button
                    className={`tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stream')}
                >
                    Stream
                </button>
                <button
                    className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('materials')}
                >
                    Materials
                </button>
                <button
                    className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assignments')}
                >
                    Assignments
                </button>
                <button
                    className={`tab-btn ${activeTab === 'people' ? 'active' : ''}`}
                    onClick={() => setActiveTab('people')}
                >
                    People
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'stream' && <Stream classId={id} />}
                {activeTab === 'materials' && <Classwork classId={id} filterType="material" className={classData?.name} />}
                {activeTab === 'assignments' && <Classwork classId={id} filterType="assignment" className={classData?.name} />}
                {activeTab === 'people' && <People classId={id} />}
            </div>
        </div>
    );
};

export default ClassDetails;
