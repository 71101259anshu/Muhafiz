import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import './JoinClass.css';

const JoinClass = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Use location to get query params
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-fill and auto-join if code is in URL
    React.useEffect(() => {
        const params = new URLSearchParams(location.search);
        const codeParam = params.get('code');
        if (codeParam) {
            setJoinCode(codeParam);
            handleJoin(codeParam); // Trigger join immediately
        }
    }, [location]);

    const handleJoin = async (codeToJoin) => {
        if (!codeToJoin) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/classes/join',
                { code: codeToJoin },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Joined class successfully!');
            navigate(`/class/${res.data.classId}`);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to join class');
            setLoading(false); // Only stop loading on error, otherwise we navigate away
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleJoin(joinCode);
    };

    return (
        <div className="join-class-page">
            <div className="join-class-card">
                <h2>Join Class</h2>
                <p>Ask your teacher for the class code, then enter it here.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Class Code (e.g. XY72K9)"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        required
                    />
                    <div className="actions">
                        <button type="button" className="cancel-btn" onClick={() => navigate('/classroom')}>Cancel</button>
                        <button type="submit" className="join-btn" disabled={!joinCode || loading}>
                            {loading ? 'Joining...' : 'Join'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinClass;
