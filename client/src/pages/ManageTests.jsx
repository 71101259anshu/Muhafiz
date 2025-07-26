import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManageTests.css';
import BackToDashboard from '../components/BackToDashboard/BackToDashboard';
import { toast } from 'react-toastify';
import axios from 'axios';

export default function ManageTests() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [editingTest, setEditingTest] = useState(null);
  const [deletingTestId, setDeletingTestId] = useState(null);

  // New state for email modal
  const [emailModalTestId, setEmailModalTestId] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/tests', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTests(res.data);
      } catch (error) {
        toast.error('Failed to fetch tests');
      }
    };

    fetchTests();
  }, []);

  const handleEdit = (test) => {
    const dateObj = new Date(test.startTime);
    const date = dateObj.toISOString().split('T')[0];
    const time = dateObj.toTimeString().split(':').slice(0, 2).join(':');
    setEditingTest({ ...test, date, time });
  };

  const handleUpdate = async () => {
    if (!editingTest.title.trim() || !editingTest.date || !editingTest.time || !editingTest.duration) {
      toast.error('Please fill out all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const startTime = new Date(`${editingTest.date}T${editingTest.time}`);
      const updatedTest = {
        title: editingTest.title,
        startTime,
        duration: editingTest.duration,
      };

      await axios.put(`http://localhost:5000/api/tests/${editingTest._id}`, updatedTest, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Test updated successfully!');
      setEditingTest(null);

      setTests((prev) =>
        prev.map((t) => (t._id === editingTest._id ? { ...t, ...updatedTest } : t))
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to update test');
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/tests/${deletingTestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTests((prev) => prev.filter((test) => test._id !== deletingTestId));
      toast.success('Test deleted successfully!');
      setDeletingTestId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete test');
    }
  };

  //  Send Emails with manual input
  const handleSendEmails = async () => {
    if (!emailInput.trim()) {
      toast.error('Please enter at least one email');
      return;
    }

    const emails = emailInput
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email !== '');

    try {
      setIsSendingEmail(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:5000/api/tests/send-invite',
        {
          testId: emailModalTestId,
          emails,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message || 'Emails sent!');
      setEmailModalTestId(null);
      setEmailInput('');
    } catch (error) {
      console.error('Email error:', error.response?.data || error.message);
      toast.error('Failed to send emails');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleManageUsers = (testId) => {
    navigate(`/admin/manage-users/${testId}`);
  };

  return (
    <div className="manage-tests">
      <div className="header-section">
        <span className="header-section-title">
          <h1>Manage Tests</h1>
        </span>
        <span className="header-section-btn">
          <button
            className="create-button"
            onClick={() => navigate('/admin/tests/create')}
          >
            + Create New Test
          </button>
        </span>
      </div>

      <div className="table-scroll-wrapper">
        <table className="tests-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Test Title</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test, index) => (
              <tr key={test._id}>
                <td>{index + 1}</td>
                <td>{test.title}</td>
                <td>{new Date(test.startTime).toLocaleString()}</td>
                <td>{test.duration} mins</td>
                <td>
                  <button className="edit-btn action-btn" onClick={() => handleEdit(test)}>Edit</button>
                  <button className="delete-btn action-btn" onClick={() => setDeletingTestId(test._id)}>Delete</button>
                  <button className="email-btn action-btn" onClick={() => setEmailModalTestId(test._id)}>Email</button>
                  <button className="report-button action-btn" onClick={() => navigate(`/report/${test._id}`)} >Report</button>
                  <button className="manage-btn action-btn" onClick={() => handleManageUsers(test._id)}>Manage</button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingTest && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Edit Test</h3>

            <label>Title</label>
            <input
              type="text"
              value={editingTest.title}
              onChange={(e) =>
                setEditingTest({ ...editingTest, title: e.target.value })
              }
            />

            <label>Date</label>
            <input
              type="date"
              value={editingTest.date}
              onChange={(e) =>
                setEditingTest({ ...editingTest, date: e.target.value })
              }
            />

            <label>Time</label>
            <input
              type="time"
              value={editingTest.time}
              onChange={(e) =>
                setEditingTest({ ...editingTest, time: e.target.value })
              }
            />

            <label>Duration (in minutes)</label>
            <input
              type="number"
              value={editingTest.duration}
              onChange={(e) =>
                setEditingTest({
                  ...editingTest,
                  duration: parseInt(e.target.value),
                })
              }
            />

            <div className="popup-actions">
              <button className="save-btn" onClick={handleUpdate}>
                Save
              </button>
              <button className="cancel-btn" onClick={() => setEditingTest(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTestId !== null && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this test?</p>
            <div className="popup-actions">
              <button className="delete-btn" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button className="cancel-btn" onClick={() => setDeletingTestId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Email Modal */}
      {emailModalTestId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Send Test Link</h3>
            <p>Enter email addresses (comma-separated):</p>
            <textarea
              rows="4"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="student1@example.com, student2@example.com"
            ></textarea>

            <div className="popup-actions">
              <button
                className="email-btn"
                onClick={handleSendEmails}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? 'Sending...' : 'Send'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setEmailModalTestId(null);
                  setEmailInput('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BackToDashboard />
    </div>
  );
}
