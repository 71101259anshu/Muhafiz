import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Reports.css'; // Reusing Report styles for consistency
import { FaCheckCircle, FaTimesCircle, FaArrowLeft } from 'react-icons/fa';

const StudentResult = () => {
    const { resultId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`/api/tests/results/${resultId}/view`, config);
                setData(res.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403) {
                    setError("Scores have not been released by the instructor yet.");
                } else if (err.response?.status === 404) {
                    setError("Result not found.");
                } else {
                    setError("Failed to load results.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId, navigate]);

    if (loading) return <div className="loading-state">Loading your results...</div>;

    if (error) {
        return (
            <div className="error-container" style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Unable to View Results</h2>
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
            </div>
        );
    }

    const { testTitle, score, totalPoints, answers } = data;
    const percentage = Math.round((score / totalPoints) * 100);

    return (
        <div className="reports-page student-view">
            <div className="reports-header glass-panel">
                <button onClick={() => navigate(-1)} className="back-nav-btn"><FaArrowLeft /> Back</button>
                <div className="header-content">
                    <h1>{testTitle}</h1>
                    <div className="score-badge main">
                        <span className="score-val">{score} / {totalPoints}</span>
                        <span className="score-percent">({percentage}%)</span>
                    </div>
                </div>
            </div>

            <div className="questions-review-list" style={{ maxWidth: '800px', margin: '20px auto' }}>
                {answers.map((ans, idx) => (
                    <div key={idx} className={`review-card ${ans.isCorrect ? 'correct' : 'wrong'}`}>
                        <div className="q-header">
                            <span className="q-num">Q{idx + 1}</span>
                            <span className="q-points">{ans.pointsAwarded} / {ans.maxPoints} pts</span>
                        </div>
                        <div className="q-text">{ans.questionText}</div>

                        <div className="ans-comparison">
                            <div className="your-ans">
                                <label>Your Answer:</label>
                                {renderAnswer(ans)}
                            </div>

                            {/* Only show correct answer if it's NOT correct (or always? usually useful for learning) */}
                            {!ans.isCorrect && ans.correctAnswer && (
                                <div className="correct-ans-box">
                                    <label>Correct Answer:</label>
                                    <div className="ans-text">{ans.correctAnswer}</div>
                                </div>
                            )}

                            {/* If type is OPTIONS, we might render them visually if 'options' array is present */}
                            {ans.options && ans.options.length > 0 && (
                                <div className="options-review">
                                    {ans.options.map(opt => (
                                        <div key={opt._id} className={`opt-row 
                                             ${ans.selectedOptions.includes(opt._id) ? 'selected' : ''}
                                             ${opt.isCorrect ? 'is-correct-opt' : ''}
                                         `}>
                                            {/* Logic to show tick/cross based on context */}
                                            {opt.text}
                                            {opt.isCorrect && <FaCheckCircle className="icon-correct" />}
                                            {ans.selectedOptions.includes(opt._id) && !opt.isCorrect && <FaTimesCircle className="icon-wrong" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {ans.feedback && (
                            <div className="teacher-feedback">
                                <strong>Feedback:</strong> {ans.feedback}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const renderAnswer = (ans) => {
    if (ans.fileUrl) return <a href={ans.fileUrl} target="_blank" rel="noreferrer" className="file-link">View Uploaded File</a>;
    if (ans.textAnswer) return <div className="ans-text">{ans.textAnswer}</div>;
    if (ans.selectedOptions && ans.options && ans.options.length === 0) return <div className="ans-text">Options selected (Refer to visual view)</div>;
    return null;
};

export default StudentResult;
