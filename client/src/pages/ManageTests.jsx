import React, { useState, useEffect } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import './ManageTests.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaEdit, FaTrash, FaEnvelope, FaChartBar, FaUsersCog, FaPlus } from 'react-icons/fa';

export default function ManageTests() {
  // Smooth scroll effect


  const navigate = useNavigate();
  const location = useLocation();

  const [tests, setTests] = useState([]);
  const [editingTest, setEditingTest] = useState(null);
  const [deletingTestId, setDeletingTestId] = useState(null);
  const [emailModalTestId, setEmailModalTestId] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Fetch all tests on mount
  const [classes, setClasses] = useState([]);

  // Fetch all tests & classes on mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/tests', { headers: { Authorization: `Bearer ${token}` } });
        setTests(res.data);
      } catch (err) {
        console.error("Test Fetch Error:", err);
      }
    };

    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/classes', { headers: { Authorization: `Bearer ${token}` } });
        setClasses(res.data);
      } catch (err) {
        console.error("Class Fetch Error:", err);
      }
    };

    fetchTests();
    fetchClasses();
  }, []);

  // Append newly created test if navigated from CreateTest
  useEffect(() => {
    if (location.state?.newTest) {
      setTests(prev => [location.state.newTest, ...prev]);
    }
  }, [location.state]);

  // Edit test
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
      const updatedTest = { title: editingTest.title, startTime, duration: editingTest.duration };

      await axios.put(`/api/tests/${editingTest._id}`, updatedTest, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Test updated successfully!');
      setEditingTest(null);

      setTests(prev => prev.map(t => (t._id === editingTest._id ? { ...t, ...updatedTest } : t)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update test');
    }
  };

  // Delete test
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tests/${deletingTestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTests(prev => prev.filter(t => t._id !== deletingTestId));
      toast.success('Test deleted successfully!');
      setDeletingTestId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete test');
    }
  };

  // Send email invites
  const handleSendEmails = async () => {
    if (!emailInput.trim()) {
      toast.error('Please enter at least one email');
      return;
    }

    const emails = emailInput
      .split(',')
      .map(e => e.trim())
      .filter(e => e);

    try {
      setIsSendingEmail(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        '/api/tests/send-invite',
        { testId: emailModalTestId, emails },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || 'Emails sent!');
      setEmailModalTestId(null);
      setEmailInput('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send emails');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleManageUsers = (testId) => {
    navigate(`/admin/manage-users/${testId}`);
  };

  return (
    <div className="manage-tests">
      <div className="header-section glass-panel">
        <div className="header-content">
          <h1>Manage Tests</h1>
          <p>Create, edit, and manage your assessments</p>
        </div>
        <button className="create-button" onClick={() => navigate('/admin/tests/create')}>
          <FaPlus /> Create New Test
        </button>
      </div>

      <div className="table-container glass-card">
        <table className="tests-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Date & Time</th>
              <th>Duration</th>
              <th>Questions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test, index) => (
              <tr key={test._id}>
                <td>{index + 1}</td>
                <td className="test-title">{test.title}</td>
                <td>{new Date(test.startTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td>{test.duration} mins</td>
                <td>{test.questionsCount || 0}</td>
                <td>
                  <div className="action-buttons-group">
                    <button className="action-btn edit" onClick={() => handleEdit(test)} title="Edit Test">
                      <FaEdit />
                    </button>
                    <button className="action-btn email" onClick={() => setEmailModalTestId(test._id)} title="Share Test">
                      <FaEnvelope />
                    </button>
                    <button className="action-btn manage" onClick={() => handleManageUsers(test._id)} title="Manage Users">
                      <FaUsersCog />
                    </button>
                    <button className="action-btn report" onClick={() => navigate(`/report/${test._id}`)} title="View Report">
                      <FaChartBar />
                    </button>
                    <button className="action-btn delete" onClick={() => setDeletingTestId(test._id)} title="Delete Test">
                      <FaTrash />
                    </button>
                  </div>
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
            <input type="text" value={editingTest.title} onChange={e => setEditingTest({ ...editingTest, title: e.target.value })} />
            <label>Date</label>
            <input type="date" value={editingTest.date} onChange={e => setEditingTest({ ...editingTest, date: e.target.value })} />
            <label>Time</label>
            <input type="time" value={editingTest.time} onChange={e => setEditingTest({ ...editingTest, time: e.target.value })} />
            <label>Duration (in minutes)</label>
            <input type="number" value={editingTest.duration} onChange={e => setEditingTest({ ...editingTest, duration: parseInt(e.target.value) })} />
            <div className="popup-actions">
              <button className="save-btn" onClick={handleUpdate}>Save</button>
              <button className="cancel-btn" onClick={() => setEditingTest(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingTestId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this test?</p>
            <div className="popup-actions">
              <button className="delete-btn" onClick={confirmDelete}>Yes, Delete</button>
              <button className="cancel-btn" onClick={() => setDeletingTestId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal (Email & Class) */}
      {emailModalTestId && (
        <div className="modal-overlay">
          <div className="modal-box share-modal">
            <h3>Share Test</h3>

            <div className="share-section">
              <h4>Via Email</h4>
              <p>Enter email addresses (comma-separated):</p>
              <textarea
                rows="3"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="student1@example.com, student2@example.com"
              />
              <button className="email-btn full-width-btn" onClick={handleSendEmails} disabled={isSendingEmail}>
                {isSendingEmail ? 'Sending Emails...' : 'Send Emails'}
              </button>
            </div>

            <div className="share-divider">
              <span>OR</span>
            </div>

            <div className="share-section">
              <h4>Via Classroom</h4>
              <p>Select a class to assign this test to:</p>
              <select
                className="class-select"
                onChange={async (e) => {
                  const classId = e.target.value;
                  if (classId) {
                    try {
                      const token = localStorage.getItem('token');
                      const res = await axios.post('/api/tests/share-to-class',
                        { testId: emailModalTestId, classId },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      toast.success(res.data.message);
                      setEmailModalTestId(null);
                      setEmailInput('');
                    } catch (err) {
                      console.error(err);
                      toast.error(err.response?.data?.message || 'Failed to share test to class');
                    }
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- Quick Add from Class --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.studentCount} students)</option>
                ))}
              </select>
            </div>

            <div className="popup-actions">
              <button className="cancel-btn" onClick={() => { setEmailModalTestId(null); setEmailInput(''); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
