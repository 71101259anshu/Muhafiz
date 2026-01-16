import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateClass.css';

const CreateClass = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        section: '',
        subject: '',
        room: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/classes', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // toast.success('Class created successfully!');
            alert('Class created successfully!');
            navigate('/classroom');
        } catch (err) {
            console.error(err);
            alert('Failed to create class');
        }
    };

    return (
        <div className="create-class-page">
            <div className="create-class-card">
                <h2>Create Class</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Class Name (Required)</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Advanced Biology"
                        />
                    </div>
                    <div className="form-group">
                        <label>Section</label>
                        <input
                            type="text"
                            name="section"
                            value={formData.section}
                            onChange={handleChange}
                            placeholder="e.g. Period 2"
                        />
                    </div>
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="e.g. Science"
                        />
                    </div>
                    <div className="form-group">
                        <label>Room</label>
                        <input
                            type="text"
                            name="room"
                            value={formData.room}
                            onChange={handleChange}
                            placeholder="e.g. 301"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => navigate('/classroom')}>Cancel</button>
                        <button type="submit" className="create-btn">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClass;
