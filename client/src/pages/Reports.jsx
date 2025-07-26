import React, { useState, useEffect } from 'react';
import './Reports.css';
import BackToDashboard from '../components/BackToDashboard/BackToDashboard';
import { useParams } from "react-router-dom";
import axios from 'axios';

const emailToName = {
  'ananya@example.com': 'Ananya Gupta',
  'rohit@example.com': 'Rohit Sharma',
  'neha@example.com': 'Neha Verma',
};

export default function Reports() {
  const { testId } = useParams();
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [attendedEmails, setAttendedEmails] = useState([]);
  const [attendedPage, setAttendedPage] = useState(1);
  const [absentPage, setAbsentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`/api/tests/${testId}`);
        setInvitedEmails(res.data.invitedEmails || []);
        setAttendedEmails(res.data.attendedEmails || []);
      } catch (err) {
        console.error("Error fetching attendance data", err);
      }
    };
    fetchAttendance();
  }, [testId]);

  const totalEnrolled = invitedEmails.length;
  const studentsAttended = attendedEmails.length;
  const studentsAbsent = totalEnrolled - studentsAttended;

  const attendedList = attendedEmails;
  const absentList = invitedEmails.filter(email => !attendedEmails.includes(email));

  const paginatedAttended = attendedList.slice(
    (attendedPage - 1) * itemsPerPage,
    attendedPage * itemsPerPage
  );
  const paginatedAbsent = absentList.slice(
    (absentPage - 1) * itemsPerPage,
    absentPage * itemsPerPage
  );

  return (
    <div className="reports-page">
      <h1 className="reports-page-title">Test Attendance Report</h1>

      <div className="attendance-summary">
        <div className="summary-box total">
          <p>Total Students</p>
          <h2>{totalEnrolled}</h2>
        </div>
        <div className="summary-box attended">
          <p>Attended</p>
          <h2>{studentsAttended}</h2>
        </div>
        <div className="summary-box absent">
          <p>Did Not Attend</p>
          <h2>{studentsAbsent}</h2>
        </div>
      </div>

      <div className="student-lists">
        <div className="student-section attended-section">
          <h3>Attended Students</h3>
          <ul>
            {paginatedAttended.map((email, index) => (
              <li key={index}>{emailToName[email] || email}</li>
            ))}
          </ul>
          <div className="pagination-controls">
            <button disabled={attendedPage === 1} onClick={() => setAttendedPage(attendedPage - 1)}>Prev</button>
            <span>Page {attendedPage}</span>
            <button
              disabled={attendedPage >= Math.ceil(attendedList.length / itemsPerPage)}
              onClick={() => setAttendedPage(attendedPage + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="student-section absent-section">
          <h3>Absent Students</h3>
          <ul>
            {paginatedAbsent.map((email, index) => (
              <li key={index}>{emailToName[email] || email}</li>
            ))}
          </ul>
          <div className="pagination-controls">
            <button disabled={absentPage === 1} onClick={() => setAbsentPage(absentPage - 1)}>Prev</button>
            <span>Page {absentPage}</span>
            <button
              disabled={absentPage >= Math.ceil(absentList.length / itemsPerPage)}
              onClick={() => setAbsentPage(absentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <BackToDashboard />
    </div>
  );
}
