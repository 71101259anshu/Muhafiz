import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTest.css';
import BackToDashboard from '../components/BackToDashboard/BackToDashboard';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function CreateTest() {
  const navigate = useNavigate();

  const [testData, setTestData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '',
    formLink: '' // ✅ Added formLink field
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTestData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const { title, date, time, duration, formLink } = testData;

  if (!title.trim() || !date || !time || !duration || !formLink.trim()) {
    toast.error("Please fill out all fields");
    return;
  }

  const startTime = new Date(`${date}T${time}`).toISOString();

  try {
    const token = localStorage.getItem('token');

    await axios.post('http://localhost:5000/api/tests', {
      title,
      duration,
      formLink,
      startTime
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    toast.success("Test created successfully!");
    navigate('/admin/tests');
  } catch (error) {
    console.error("Axios Error:", error.response?.data || error.message);
    toast.error("Failed to create test");
  }
};


  return (
    <div className="page-wrapper">
      <div className="create-test-container">
        <h2>Create New Test</h2>
        <form onSubmit={handleSubmit} className="create-form">
          <label>Test Title</label>
          <input
            type="text"
            name="title"
            value={testData.title}
            onChange={handleChange}
            required
          />

          <label>Test Date</label>
          <input
            type="date"
            name="date"
            value={testData.date}
            onChange={handleChange}
            required
          />

          <label>Test Start Time</label>
          <input
            type="time"
            name="time"
            value={testData.time}
            onChange={handleChange}
            required
          />

          <label>Duration (in minutes)</label>
          <input
            type="number"
            name="duration"
            value={testData.duration}
            onChange={handleChange}
            required
          />

          <label>Form Link (Google/Microsoft)</label>
          <input
            type="text"
            name="formLink"
            value={testData.formLink}
            onChange={handleChange}
            required
          />

          <button type="submit" className="submit-btn">Create Test</button>
        </form>

        <BackToDashboard />
      </div>
    </div>
  );
}
