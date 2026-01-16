import React, { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserGraduate, FaClipboardList, FaChalkboardTeacher, FaUsersCog, FaChartBar, FaClipboardCheck, FaBook } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTests: 0,
    totalClasses: 0,
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

      <div className="dashboard-container">
        <h1 className="dashboard-title">Admin Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><FaChalkboardTeacher /></div>
            <div>
              <h2>Classrooms</h2>
              <p>{stats.totalClasses}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaUsersCog /></div>
            <div>
              <h2>Registered Students</h2>
              <p>{stats.registeredStudents}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaClipboardList /></div>
            <div>
              <h2>Total Tests</h2>
              <p>{stats.totalTests}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaChartBar /></div>
            <div>
              <h2>Active Exams</h2>
              <p>{stats.activeExams}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon alert"><FaUserGraduate /></div>
            <div>
              <h2>Flagged Sessions</h2>
              <p>{stats.flaggedSessions}</p>
            </div>
          </div>
        </div>

        {/* NEW: Quick Actions Grid Section */}
        <h2 className="section-heading">Quick Actions</h2>
        <div className="actions-grid">
          <div onClick={() => navigate('/admin/tests')} className="action-card blue">
            <div className="action-icon"><FaClipboardList /></div>
            <div className="action-info">
              <h3>Manage Tests</h3>
              <p>Create, edit & share assessments</p>
            </div>
          </div>
          <div onClick={() => navigate('/classroom')} className="action-card purple">
            <div className="action-icon"><FaChalkboardTeacher /></div>
            <div className="action-info">
              <h3>Manage Classes</h3>
              <p>Organize students & assignments</p>
            </div>
          </div>
          <div onClick={() => navigate('/admin/users')} className="action-card green">
            <div className="action-icon"><FaUsersCog /></div>
            <div className="action-info">
              <h3>Manage Students</h3>
              <p>Control access & permissions</p>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="main-content full-width">

            <div className="section-card">
              <h2>Recent Activity</h2>
              <ul className="activity-log">
                {recentLogs.length === 0 ? (
                  <li className="no-activity">No recent activity</li>
                ) : (
                  recentLogs.map((log, index) => (
                    <li key={index} className="activity-item">
                      <span className="activity-icon">
                        {log.type === 'test' && <FaClipboardList className="icon-blue" />}
                        {log.type === 'class' && <FaChalkboardTeacher className="icon-purple" />}
                        {log.type === 'classwork' && log.subType === 'assignment' && <FaClipboardCheck className="icon-orange" />}
                        {log.type === 'classwork' && log.subType === 'material' && <FaBook className="icon-green" />}
                      </span>
                      <span className="activity-text">
                        {log.type === 'test' && <>Created Test <strong>"{log.title}"</strong></>}
                        {log.type === 'class' && <>Created Class <strong>"{log.title}"</strong></>}
                        {log.type === 'classwork' && log.subType === 'assignment' && <>Posted Assignment <strong>"{log.title}"</strong></>}
                        {log.type === 'classwork' && log.subType === 'material' && <>Shared Material <strong>"{log.title}"</strong></>}
                        <span className="activity-date"> on {log.date}</span>
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
