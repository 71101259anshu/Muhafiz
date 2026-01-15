import React, { useState, useEffect } from 'react';

import './Reports.css';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { FaUsers, FaUserCheck, FaUserTimes, FaChalkboardTeacher, FaChevronLeft, FaChevronRight, FaEnvelope } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const emailToName = {
  'ananya@example.com': 'Ananya Gupta',
  'rohit@example.com': 'Rohit Sharma',
  'neha@example.com': 'Neha Verma',
};

export default function Reports() {

  const { testId } = useParams();
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'attended' | 'absent' | 'total' | null
  const [gradingResult, setGradingResult] = useState(null); // Result being graded
  const [questions, setQuestions] = useState([]); // Questions for reference
  const [releaseScores, setReleaseScores] = useState(false); // State for publish status
  const [testTitle, setTestTitle] = useState(""); // Title state

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const [activityRes, resultsRes, testRes] = await Promise.all([
          axios.get(`/api/tests/${testId}/activity`),
          axios.get(`/api/tests/${testId}/results`),
          axios.get(`/api/tests/${testId}`)
        ]);
        setStudents(activityRes.data);
        setResults(resultsRes.data);
        setQuestions(testRes.data.questions || []);
        setReleaseScores(testRes.data.releaseScores || false);
        setTestTitle(testRes.data.title);
      } catch (err) {
        console.error("Error fetching report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [testId]);

  const handlePublish = async () => {
    try {
      const res = await axios.put(`/api/tests/${testId}/publish`);
      setReleaseScores(res.data.releaseScores);
      alert(res.data.message);
    } catch (err) {
      console.error("Error publishing results:", err);
      alert("Failed to update publish status");
    }
  };

  const handleEmailResults = async () => {
    if (!window.confirm("Are you sure you want to email results to ALL students?")) return;
    try {
      const res = await axios.post(`/api/tests/${testId}/email-results`);
      alert(res.data.message);
    } catch (err) {
      console.error("Error sending emails:", err);
      alert(err.response?.data?.message || "Failed to send emails");
    }
  };

  const totalEnrolled = students.length;
  const attendedList = students.filter(s => s.status === 'Present');
  const absentList = students.filter(s => s.status === 'Absent');

  const studentsAttended = attendedList.length;
  const studentsAbsent = absentList.length;

  // Calculate Metrics
  const scores = results.map(r => r.score).sort((a, b) => a - b);

  // Average
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 0;

  // Median
  const mid = Math.floor(scores.length / 2);
  const medianScore = scores.length === 0 ? 0 :
    scores.length % 2 !== 0 ? scores[mid] : ((scores[mid - 1] + scores[mid]) / 2).toFixed(1);

  // Pass/Fail (Assume 40% threshold for now)
  const passThresholdRatio = 0.4;
  const passedCount = results.filter(r => (r.score / (r.totalPoints || 1)) >= passThresholdRatio).length;
  const failedCount = results.length - passedCount;

  const openModal = (type) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);
  const closeGrading = () => setGradingResult(null);

  const handleGradeSave = async (updatedAnswers) => {
    if (!gradingResult) return;
    try {
      const payload = {
        gradedAnswers: updatedAnswers
      };
      await axios.put(`/api/tests/results/${gradingResult._id}/grade`, payload);

      // Refresh results
      const res = await axios.get(`/api/tests/${testId}/results`);
      setResults(res.data);
      setGradingResult(null); // Close modal
      alert("Grades updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to save grades.");
    }
  };

  return (
    <div className="reports-page">
      <div className="reports-header glass-panel">
        <div className="header-left">
          <h1 className="reports-page-title">
            {testTitle || "Test Results"}
          </h1>
        </div>
      </div>

      <div className="report-stats-grid">
        <div className="attendance-summary">
          <div className="summary-box total glass-card clickable" onClick={() => openModal('total')}>
            <div className="icon"><FaUsers /></div>
            <div className="info">
              <p>Total Invited</p>
              <h2>{totalEnrolled}</h2>
              <span className="click-hint">View List</span>
            </div>
          </div>

          <div className="summary-box attended glass-card clickable" onClick={() => openModal('attended')}>
            <div className="icon"><FaUserCheck /></div>
            <div className="info">
              <p>Present</p>
              <h2>{studentsAttended}</h2>
              <span className="click-hint">View List</span>
            </div>
          </div>

          <div className="summary-box absent glass-card clickable" onClick={() => openModal('absent')}>
            <div className="icon"><FaUserTimes /></div>
            <div className="info">
              <p>Absent</p>
              <h2>{studentsAbsent}</h2>
              <span className="click-hint">View List</span>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {/* Premium Performance Overview */}
        <div className="performance-overview glass-card">
          <h3>📊 Performance Analysis</h3>

          <div className="charts-grid">
            {/* Column 1: Key Metrics */}
            <div className="metrics-column">
              <div className="perf-card highlight-blue">
                <span className="perf-label">Avg. Score</span>
                <span className="perf-value">{avgScore}</span>
                <span className="perf-sub">Class Average</span>
              </div>
              <div className="perf-card highlight-purple">
                <span className="perf-label">Median Score</span>
                <span className="perf-value">{medianScore}</span>
                <span className="perf-sub">Midpoint</span>
              </div>
              <div className="perf-card highlight-green">
                <span className="perf-label">Passed</span>
                <span className="perf-value">{passedCount}</span>
                <span className="perf-sub">&gt; 40% Score</span>
              </div>
              <div className="perf-card highlight-red">
                <span className="perf-label">Failed</span>
                <span className="perf-value">{failedCount}</span>
                <span className="perf-sub">&lt; 40% Score</span>
              </div>
            </div>

            {/* Column 2: Score Distribution Bar Chart */}
            <div className="chart-box">
              <h4>Score Distribution</h4>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.map((r, i) => ({ name: `S${i + 1}`, score: r.score }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="score" fill="#4f46e5" radius={[4, 4, 0, 0]} animateNewValues={true} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Column 3: Pass/Fail Pie Chart */}
            <div className="chart-box">
              <h4>Pass Rate</h4>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Passed', value: passedCount },
                        { name: 'Failed', value: failedCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#64748b' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div> Passed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#64748b' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div> Failed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="results-section glass-card">
        <div className="section-header-row">
          <h3>Student Submissions</h3>
          <button className="publish-btn email-btn" onClick={handleEmailResults} title="Email Results to Graded Students">
            <FaEnvelope /> Email Results
          </button>
        </div>
        <div className="table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map(res => (
                <tr key={res._id}>
                  <td>{res.studentName} <br /><small>{res.studentEmail}</small></td>
                  <td>{res.score} / {res.totalPoints}</td>
                  <td>
                    {res.isGraded ?
                      <span className="badge success">Graded</span> :
                      <span className="badge warning">Needs Grading</span>
                    }
                  </td>
                  <td>
                    <button className="grade-btn" onClick={() => setGradingResult(res)}>Assess Quiz</button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan="4">No submissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>


      {/* Modals */}
      {
        activeModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3>
                {activeModal === 'attended' && 'Attended Students'}
                {activeModal === 'absent' && 'Absent Students'}
                {activeModal === 'total' && 'All Invited Students'}
              </h3>
              <ul className="student-list scrollable-list">
                {(() => {
                  let list = [];
                  if (activeModal === 'attended') list = attendedList;
                  else if (activeModal === 'absent') list = absentList;
                  else if (activeModal === 'total') list = students;

                  return list.length > 0 ? list.map((student, index) => (
                    <li key={index}>
                      <div className={`avatar ${student.status === 'Absent' ? 'grey' : ''}`}>
                        {student.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="student-info">
                        <span className="name">{student.name}</span>
                        <span className="email">{student.email}</span>
                        {activeModal === 'total' && (
                          <span className={`status-badge ${student.status.toLowerCase()}`}>
                            {student.status}
                          </span>
                        )}
                      </div>
                    </li>
                  )) : <li className="empty-msg">No students found.</li>;
                })()}
              </ul>
              <div className="popup-actions">
                <button className="cancel-btn" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Grading Modal */}
      {
        gradingResult && (
          <GradingModal
            result={gradingResult}
            questions={questions}
            onClose={closeGrading}
            onSave={handleGradeSave}
          />
        )
      }

    </div >
  );
}

// Sub-component for Grading (Defined in same file for layout simplicity)
function GradingModal({ result, questions, onClose, onSave }) {
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [grades, setGrades] = useState(
    result.answers.map(ans => ({
      questionId: ans.questionId,
      pointsAwarded: ans.pointsAwarded,
      feedback: ans.feedback || ""
    }))
  );

  const handleGradeChange = (qId, field, value) => {
    setGrades(prev => prev.map(g =>
      g.questionId === qId ? { ...g, [field]: value } : g
    ));
  };

  // Robust ID matching
  const getQuestion = (qId) => questions.find(q => q.id === qId || q._id?.toString() === qId);

  const totalQuestions = result.answers.length;
  const currentAns = result.answers[currentQIdx];
  const question = getQuestion(currentAns.questionId);
  const currentGrade = grades.find(g => g.questionId === currentAns.questionId);

  const goNext = () => {
    if (currentQIdx < totalQuestions - 1) setCurrentQIdx(prev => prev + 1);
  };

  const goPrev = () => {
    if (currentQIdx > 0) setCurrentQIdx(prev => prev - 1);
  };

  return (
    <div className="modal-overlay grading-layer">
      <div className="modal-box grading-box">
        <div className="grading-header">
          <h3>Assessment: {result.studentName}</h3>
          <button className="close-x" onClick={onClose}>&times;</button>
        </div>

        <div className="grading-content">
          {/* Progress Bar */}
          <div className="q-nav-header" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="q-step" style={{ fontWeight: '700', color: '#64748b' }}>Question {currentQIdx + 1} of {totalQuestions}</span>
            <span className="max-points-badge"> Max: {question?.points || 0} pts</span>
          </div>

          <div className="grade-item active-card">
            <div className="q-preview">
              <h4 className="q-text-view" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{question?.text || "Question not found"}</h4>
            </div>

            <div className="ans-preview">
              {/* === FILE UPLOAD === */}
              {question?.type === 'file' && (
                <div className="file-ans-box">
                  <span className="type-badge">File Upload</span>
                  {currentAns.fileUrl ? (
                    <a href={`http://localhost:5000${currentAns.fileUrl}`} target="_blank" rel="noopener noreferrer" className="file-link-btn primary">
                      📄 View Student's File
                    </a>
                  ) : <span className="no-ans">No file uploaded</span>}
                </div>
              )}

              {/* === SHORT ANSWER === */}
              {question?.type === 'short-answer' && (
                <div className="text-ans-box">
                  <span className="type-badge">Short Answer</span>
                  <div className="cmp-row">
                    <div className="cmp-item">
                      <label>Student Answer:</label>
                      <input type="text" value={currentAns.textAnswer || ""} disabled className="read-input student" />
                    </div>
                    {question.correctAnswer && (
                      <div className="cmp-item">
                        <label>Correct Answer:</label>
                        <input type="text" value={question.correctAnswer} disabled className="read-input correct" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === PARAGRAPH === */}
              {question?.type === 'paragraph' && (
                <div className="text-ans-box">
                  <span className="type-badge">Paragraph</span>
                  <textarea value={currentAns.textAnswer || ""} disabled className="read-area student" />
                </div>
              )}

              {/* === OPTIONS (MCQ / Checkbox / Dropdown) === */}
              {['mcq', 'checkboxes', 'true-false', 'dropdown', 'radio'].includes(question?.type) && (
                <div className="opt-ans-box">
                  <span className="type-badge">Multiple Choice</span>
                  <div className="visual-opts">
                    {question?.options?.map((opt, oIdx) => {
                      const optId = opt.id || (opt._id ? opt._id.toString() : `opt_${oIdx}`);
                      const isSelected = (currentAns.selectedOptions || []).includes(optId);
                      const isCorrectKey = opt.isCorrect;

                      const inputType = question.type === 'checkboxes' ? 'checkbox' : 'radio';

                      return (
                        <div key={optId} className={`visual-opt-row ${isSelected ? 'v-selected' : ''} ${isCorrectKey ? 'v-correct' : ''}`}>
                          <input
                            type={inputType}
                            checked={isSelected}
                            disabled
                            className="v-input"
                          />
                          <span className="v-text">{opt.text}</span>
                          {isCorrectKey && <span className="v-badge correct">Correct</span>}
                          {isSelected && !isCorrectKey && <span className="v-badge wrong">Selected</span>}
                          {isSelected && isCorrectKey && <span className="v-badge success">Match</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grade-actions">
              <label>
                Marks Awarded:
                <input
                  type="number"
                  value={currentGrade?.pointsAwarded || 0}
                  onChange={(e) => handleGradeChange(currentAns.questionId, 'pointsAwarded', e.target.value)}
                  className="grade-input"
                />
              </label>
              <label style={{ flex: 1 }}>
                Feedback:
                <input
                  type="text"
                  value={currentGrade?.feedback || ""}
                  onChange={(e) => handleGradeChange(currentAns.questionId, 'feedback', e.target.value)}
                  placeholder="Review feedback..."
                  className="feedback-input"
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="popup-actions nav-actions" style={{ justifyContent: 'space-between' }}>
          <div className="nav-btns" style={{ gap: '10px', display: 'flex' }}>
            <button
              className="nav-btn-icon"
              onClick={goPrev}
              disabled={currentQIdx === 0}
              style={{
                background: currentQIdx === 0 ? '#bbf7d0' : '#22c55e',
                cursor: currentQIdx === 0 ? 'not-allowed' : 'pointer',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'background 0.2s'
              }}
              title="Previous Question"
            >
              <FaChevronLeft />
            </button>
            <button
              className="nav-btn-icon"
              onClick={goNext}
              disabled={currentQIdx === totalQuestions - 1}
              style={{
                background: currentQIdx === totalQuestions - 1 ? '#bbf7d0' : '#22c55e',
                cursor: currentQIdx === totalQuestions - 1 ? 'not-allowed' : 'pointer',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'background 0.2s'
              }}
              title="Next Question"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="save-area" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span className="total-preview">Total: {grades.reduce((a, b) => a + parseFloat(b.pointsAwarded || 0), 0)}</span>
            <button className="confirm-btn" onClick={() => onSave(grades)}>Finish & Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
