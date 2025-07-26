import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTests: 0,
    activeExams: 0,
    flaggedSessions: 0,
    registeredStudents: 0,
  });

  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get('/api/tests/dashboard-stats');
        setStats(res.data.stats);
        setRecentLogs(res.data.recentLogs);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard">
      <Link to="/" className="back-btn">← Back to Home</Link>

      <div className="dashboard-container">
        <h1 className="dashboard-title">Admin Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>Total Tests</h2>
          <p>{stats.totalTests}</p>
        </div>
        <div className="stat-card">
          <h2>Active Exams</h2>
          <p>{stats.activeExams}</p>
        </div>
        <div className="stat-card">
          <h2>Flagged Sessions</h2>
          <p>{stats.flaggedSessions}</p>
        </div>
        <div className="stat-card">
          <h2>Registered Students</h2>
          <p>{stats.registeredStudents}</p>
        </div>
      </div>

      <div className="button-group">
        <button onClick={() => navigate('/admin/tests')}>Manage Tests</button>
      </div>

      <div className="activity-section">
        <h2>Recent Activity</h2>
        <ul className="activity-log">
          {recentLogs.length === 0 ? (
            <li>No recent activity</li>
          ) : (
            recentLogs.map((log, index) => <li key={index}>{log}</li>)
          )}
        </ul>
      </div>
    </div>
  );
}
