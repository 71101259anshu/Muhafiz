import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import "./CreateTest.css";
import { createTest } from "../api/testApi";
import { FaPlusCircle, FaTrash, FaCopy, FaImage, FaCheck, FaListUl, FaRegCheckSquare, FaRegDotCircle, FaCheckCircle, FaCheckSquare } from "react-icons/fa";
import { MdShortText, MdSubject, MdCheckBox, MdQuiz } from "react-icons/md";

export default function CreateTest() {
  const navigate = useNavigate();

  // Test details
  const [title, setTitle] = useState("Untitled Quiz");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false); // New State

  // Form builder state
  const [questions, setQuestions] = useState([
    {
      id: uuidv4(),
      type: "mcq",
      text: "",
      points: 1,
      negativePoints: 0,
      explanation: "",
      isShuffle: false,
      options: [{ id: uuidv4(), text: "Option 1", isCorrect: false }],
      required: false,
      file: null,
      previewUrl: null,
      showAnswerKey: false // UI state to toggle Answer Key view
    }
  ]);

  const [activeQuestionId, setActiveQuestionId] = useState(questions[0].id);

  // === ACTIONS ===

  const handleAddQuestion = () => {
    const newQuestion = {
      id: uuidv4(),
      type: "mcq",
      text: "",
      points: 1,
      negativePoints: 0,
      explanation: "",
      isShuffle: false,
      options: [{ id: uuidv4(), text: "Option 1", isCorrect: false }],
      required: false,
      file: null,
      previewUrl: null,
      showAnswerKey: false
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setActiveQuestionId(newQuestion.id);
  };

  const addHeaderSection = () => {
    const newSection = {
      id: uuidv4(),
      type: "section",
      text: "Untitled Section",
      description: "Description (optional)",
      points: 0,
      options: []
    };
    setQuestions((prev) => [...prev, newSection]);
    setActiveQuestionId(newSection.id);
  }

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const toggleAnswerKey = (id) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, showAnswerKey: !q.showAnswerKey } : q));
  }

  // Options Logic
  const handleOptionChange = (qId, optId, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? {
          ...q,
          options: q.options.map((o) => o.id === optId ? { ...o, text: value } : o)
        } : q
      )
    );
  };

  const addOption = (qId) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? {
          ...q,
          options: [...q.options, { id: uuidv4(), text: `Option ${q.options.length + 1}`, isCorrect: false }],
        } : q
      )
    );
  };

  const removeOption = (qId, optId) => {
    setQuestions((prev) =>
      prev.map((q) => q.id === qId ? { ...q, options: q.options.filter((o) => o.id !== optId) } : q)
    );
  };

  const handleCorrectChange = (qId, optId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (["mcq", "true-false"].includes(q.type)) {
          // Single Select
          return { ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === optId })) };
        } else {
          // Multi Select
          return { ...q, options: q.options.map(o => o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o) };
        }
      })
    );
  };

  // Image Helper
  const handleFileChange = (id, file) => {
    if (!file) return;
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          if (q.previewUrl) URL.revokeObjectURL(q.previewUrl);
          return { ...q, file, previewUrl: URL.createObjectURL(file) };
        }
        return q;
      })
    );
  };

  // Duplicate & Delete
  const duplicateQuestion = (index) => {
    const qToClone = questions[index];
    const clonedQuestion = {
      ...qToClone,
      id: uuidv4(),
      options: qToClone.options.map(o => ({ ...o, id: uuidv4() })),
      text: qToClone.text + " (Copy)",
      file: null,
      previewUrl: null
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, clonedQuestion);
    setQuestions(newQuestions);
  };

  const deleteQuestion = (id) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const moveQuestion = (index, direction) => {
    const newQs = [...questions];
    const target = index + direction;
    if (target >= 0 && target < questions.length) {
      [newQs[index], newQs[target]] = [newQs[target], newQs[index]];
      setQuestions(newQs);
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!title.trim() || !date || !time || Number(duration) <= 0) {
      alert("Please fill all test details correctly");
      return;
    }

    const startTime = new Date(`${date}T${time}`).toISOString();
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description);
    formData.append("duration", Number(duration));
    formData.append("startTime", startTime);
    formData.append("biometricEnabled", biometricEnabled); // Send flag

    // Filter out sections from being "Questions" if backend doesn't support them, or send them as special types.
    // For now, we will send them as questions with type='section' and backend should store them.
    // We already updated schema to allow new fields.

    // Map questions for JSON string
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      required: q.required,
      points: q.type === 'section' ? 0 : q.points,
      negativePoints: q.negativePoints,
      explanation: q.explanation,
      isShuffle: q.isShuffle,
      options: q.options
    }));

    formData.append("questions", JSON.stringify(formattedQuestions));

    // Append files
    questions.forEach((q, idx) => {
      if (q.file) formData.append(`questionFile_${idx}`, q.file);
    });

    try {
      const token = localStorage.getItem("token");
      const data = await createTest(formData, token);
      alert("Quiz created successfully!");
      navigate("/admin/tests", { state: { newTest: data.test } });
    } catch (err) {
      console.error(err);
      alert(err.message || "Error creating test");
    }
  };

  return (
    <>
      <div className="create-quiz-page">
        <div className="quiz-header">
          <input type="text" className="quiz-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Untitled Quiz" />
          <textarea className="quiz-desc-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Form description" rows="1" />

          <div className="quiz-meta-row">
            <label>Date <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label>Time <input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
            <label>Duration (min) <input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '80px' }} /></label>

            <label className="switch-label" style={{ marginLeft: 'auto', flexDirection: 'row', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Biometric Verification</span>
              <input type="checkbox" checked={biometricEnabled} onChange={e => setBiometricEnabled(e.target.checked)} />
              <div className="switch-slider"></div>
            </label>
          </div>

          <button className="publish-btn" onClick={handleSubmit}>Publish Quiz</button>
        </div>

        <div className="quiz-builder-container">
          <div className="questions-list">
            {questions.map((q, index) => (
              <div key={q.id} className={`question-card glass-card ${activeQuestionId === q.id ? 'active' : ''}`} onClick={() => setActiveQuestionId(q.id)}>

                {q.type === 'section' ? (
                  // SECTION HEADER UI
                  <div className="section-block">
                    <input type="text" className="quiz-title-input" style={{ fontSize: '24px' }} value={q.text} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="Section Title" />
                    <textarea className="quiz-desc-input" value={q.explanation} onChange={e => handleQuestionChange(q.id, 'explanation', e.target.value)} placeholder="Section Description (Optional)" />
                    <div className="card-footer" style={{ justifyContent: 'flex-end' }}>
                      <button className="tool-icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id) }}><FaTrash /></button>
                    </div>
                  </div>
                ) : (
                  // QUESTION UI
                  <>
                    <div className="question-row-top">
                      <input type="text" className="question-text-input" value={q.text} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="Question" />

                      <select className="question-type-select" value={q.type} onChange={e => handleQuestionChange(q.id, 'type', e.target.value)}>
                        <option value="mcq">Multiple Choice</option>
                        <option value="checkboxes">Checkboxes</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="paragraph">Paragraph</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="file">File Upload</option>
                      </select>

                      {/* Image Upload Trigger */}
                      <div className="image-upload-wrapper">
                        <label htmlFor={`file-${q.id}`} className="image-trigger-btn" title="Add Image"><FaImage /></label>
                        <input id={`file-${q.id}`} type="file" hidden onChange={(e) => handleFileChange(q.id, e.target.files[0])} />
                      </div>
                    </div>

                    {q.previewUrl && <img src={q.previewUrl} className="preview-image" alt="Question Visual" />}

                    {/* OPTIONS RENDER */}
                    {["mcq", "checkboxes", "dropdown", "true-false"].includes(q.type) && (
                      <div className="options-list">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className="option-row"
                            onClick={(e) => {
                              // If Answer Key mode is active & incorrect target (not input/btn), allow toggle
                              if (q.showAnswerKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
                                handleCorrectChange(q.id, opt.id);
                              }
                            }}
                            style={{ cursor: q.showAnswerKey ? 'pointer' : 'default' }}
                          >
                            <span
                              className="option-marker"
                              style={{ color: opt.isCorrect ? '#10b981' : '#94a3b8' }}
                            >
                              {/* Show Checked Green Icon if isCorrect, else Empty Icon */}
                              {(q.type === 'mcq' || q.type === 'true-false' || q.type === 'dropdown') ? (
                                opt.isCorrect ? <FaCheckCircle /> : <FaRegDotCircle />
                              ) : (
                                opt.isCorrect ? <FaCheckSquare /> : <FaRegCheckSquare />
                              )}
                            </span>

                            <input
                              type="text"
                              className="option-input"
                              value={opt.text}
                              onChange={e => handleOptionChange(q.id, opt.id, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                            />

                            {!q.showAnswerKey && (
                              <button className="remove-option-btn" onClick={() => removeOption(q.id, opt.id)}>×</button>
                            )}

                            {/* Answer Key Selection Mode */}
                            {q.showAnswerKey && (
                              <div className={`correct-selector ${opt.isCorrect ? 'selected' : ''}`} onClick={() => handleCorrectChange(q.id, opt.id)}>
                                {opt.isCorrect ? <FaCheck /> : null}
                                {opt.isCorrect ? " Correct" : " Mark Correct"}
                              </div>
                            )}
                          </div>
                        ))}
                        {!q.showAnswerKey && (
                          <button className="add-option-btn" onClick={() => addOption(q.id)}>Add option</button>
                        )}
                      </div>
                    )}

                    {/* ANSWER KEY PANEL (Google Form Style) */}
                    {q.showAnswerKey && (
                      <div className="answer-key-section">
                        <div className="key-header">
                          <span>Answer Key Settings</span>
                          <button onClick={() => toggleAnswerKey(q.id)} style={{ cursor: 'pointer', border: 'none', background: 'none', color: '#28a745' }}>Done</button>
                        </div>
                        <div className="points-row">
                          <div className="points-input-group">
                            <label>Points</label>
                            <input type="number" min="0" value={q.points} onChange={e => handleQuestionChange(q.id, 'points', parseInt(e.target.value) || 0)} />
                          </div>
                          <div className="points-input-group">
                            <label>Neg. Points</label>
                            <input type="number" min="0" value={q.negativePoints} onChange={e => handleQuestionChange(q.id, 'negativePoints', parseInt(e.target.value) || 0)} />
                          </div>
                        </div>

                        {/* Auto-Grade for Short Answer */}
                        {q.type === 'short-answer' && (
                          <div style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Correct Answer (for Exact Match Auto-Grading)</label>
                            <input
                              type="text"
                              className="question-text-input"
                              style={{ fontSize: '14px', marginTop: '5px' }}
                              value={q.correctAnswer || ""}
                              onChange={e => handleQuestionChange(q.id, 'correctAnswer', e.target.value)}
                              placeholder="Enter the exact answer to match..."
                            />
                            <small style={{ color: 'gray' }}>Case-insensitive match. If matched, full points are awarded.</small>
                          </div>
                        )}

                        <div style={{ marginTop: '10px' }}>
                          <label style={{ fontSize: '12px', color: '#5f6368' }}>Answer Feedback / Explanation</label>
                          <textarea className="explanation-area" value={q.explanation} onChange={e => handleQuestionChange(q.id, 'explanation', e.target.value)} placeholder="Add answer feedback..." />
                        </div>
                      </div>
                    )}

                    {/* FOOTER */}
                    <div className="card-footer">
                      <div className="footer-left">
                        <button className="answer-key-btn" onClick={() => toggleAnswerKey(q.id)}>
                          <MdQuiz /> {q.showAnswerKey ? "Close Answer Key" : "Answer Key"}
                        </button>
                        <div style={{ marginLeft: '15px', color: 'gray', fontSize: '13px' }}>
                          {q.points} pts
                        </div>
                      </div>

                      <div className="footer-right">
                        <button className="tool-icon-btn" onClick={() => duplicateQuestion(index)} title="Duplicate"><FaCopy /></button>
                        <button className="tool-icon-btn delete-btn" onClick={() => deleteQuestion(q.id)} title="Delete"><FaTrash /></button>
                        <div className="divider"></div>
                        <label className="switch-label">Required <input type="checkbox" checked={q.required} onChange={e => handleQuestionChange(q.id, 'required', e.target.checked)} /></label>
                        <label className="switch-label">Shuffle <input type="checkbox" checked={q.isShuffle} onChange={e => handleQuestionChange(q.id, 'isShuffle', e.target.checked)} /></label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* FLOATING SIDEBAR */}
          <div className="floating-sidebar">
            <button className="float-btn add-q" onClick={handleAddQuestion} title="Add Question"><FaPlusCircle /></button>
            <button className="float-btn" onClick={addHeaderSection} title="Add Section Title"><MdShortText /></button>
            <button className="float-btn" title="Add Image (Standalone)"><FaImage /></button>
          </div>
        </div>
      </div>
    </>

  );
}
