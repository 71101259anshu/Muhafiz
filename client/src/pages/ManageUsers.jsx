import React, { useEffect, useState } from 'react';
import './ManageUsers.css';
import BackToDashboard from '../components/BackToDashboard/BackToDashboard';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function ManageUsers() {
  const { testId } = useParams();
  const [students, setStudents] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [invitedEmails, setInvitedEmails] = useState([]);

  // ✅ Fetch student activity logs
  const fetchStudentActivity = async () => {
    try {
      const res = await axios.get(`/api/tests/${testId}/activity`);
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load student activity');
    }
  };

  // ✅ Fetch invited emails list (if needed elsewhere)
  const fetchInvitedEmails = async () => {
    try {
      const res = await axios.get(`/api/tests/${testId}`);
      setInvitedEmails(res.data.invitedEmails || []);
    } catch (err) {
      console.error("Error fetching invited emails:", err);
    }
  };

  useEffect(() => {
    fetchStudentActivity();
    fetchInvitedEmails();
  }, [testId]);

  // ✅ Send warning to backend
  const handleWarn = async (student) => {
    try {
      await axios.post('/api/proctor/send-warning', {
        testId,
        email: student.email,
      });
      toast.warning(`⚠️ Warning sent to ${student.name || student.email}`);
    } catch (err) {
      toast.error('Failed to send warning');
    }
    setActiveModal(null);
  };

  // ✅ Remove student via backend and refresh state
  const handleRemove = async (student) => {
    const confirmed = window.confirm(`Are you sure you want to remove ${student.email} from the test?`);
    if (!confirmed) return;

    try {
      const res = await axios.post(`/api/tests/${testId}/remove-student`, {
        email: student.email,
      });
      setInvitedEmails(res.data.updatedInvitedEmails || []);
      toast.success("Student removed successfully.");

      // 🔁 Refresh activity list
      fetchStudentActivity();
    } catch (err) {
      console.error("Error removing student:", err);
      toast.error("Failed to remove student.");
    }

    setActiveModal(null);
  };

  return (
    <div className="manage-users">
      <h1 className="manage-users-title">Manage Students</h1>

      <div className="table-scroll-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>
                  <button className="view-btn" onClick={() => setActiveModal(index)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeModal !== null && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Activity Log for {students[activeModal].name}</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
              <ul className="activity-log">
                {students[activeModal].inactivityLogs.map((log, i) => (
                  <li key={i}>⚠️ {log}</li>
                ))}
              </ul>
            </div>
            <div className="popup-actions">
              <button className="warn-btn" onClick={() => handleWarn(students[activeModal])}>
                Send Warning
              </button>
              <button className="remove-btn" onClick={() => handleRemove(students[activeModal])}>
                Remove Student
              </button>
              <button className="cancel-btn" onClick={() => setActiveModal(null)}>
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
