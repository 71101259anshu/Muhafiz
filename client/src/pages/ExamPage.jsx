import React, { useEffect, useState, useRef } from "react";

import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Webcam from "react-webcam";
import "./ExamPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from 'socket.io-client';
import * as faceapi from 'face-api.js/dist/face-api.js';

const ExamPage = () => {
  // === 1. Init & Security State ===
  const { testId } = useParams();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const webcamRef = useRef(null);
  const email = localStorage.getItem("email") || JSON.parse(localStorage.getItem("user") || "{}").email;
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const name = userObj.username || userObj.name || "Student";
  const tabId = useRef(`${Date.now()}-${Math.random()}`);
  const socketRef = useRef(null);

  // === 2. Quiz Data State ===
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { qId: { selectedOptions: [], textAnswer: "" } }

  // === 3. Exam Status State ===
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // === 4. Proctoring State ===
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [warningCount, setWarningCount] = useState(0);



  // === Fetch Test Data ===
  useEffect(() => {
    const initExam = async () => {
      // 1. Verify Face Check Passed (Conditional)
      // Note: We check this AFTER fetching test data


      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/tests/${testId}/student`, {
          headers: { Authorization: `Bearer ${token}` }
        }); // Use STUDENT endpoint
        const data = res.data;

        // Check Schedule
        const now = new Date();
        const start = new Date(data.startTime);
        if (now < start) {
          toast.error("Test has not started yet.");
          navigate('/dashboard');
          return;
        }

        // Check 48-Hour Expiry
        const expiryTime = start.getTime() + (48 * 60 * 60 * 1000);
        if (now.getTime() > expiryTime) {
          toast.error("Test availability has expired (48-hour limit).");
          navigate('/dashboard');
          return;
        }

        setTest(data);

        // ✅ Conditional Verification Check
        if (data.biometricEnabled) {
          const isVerified = localStorage.getItem(`verified-${testId}`) === 'true';
          if (!isVerified) {
            toast.error("Verification required");
            navigate('/face-verification', { state: { testId } });
            return;
          }
        }

        // Handle Shuffle
        let qs = data.questions || [];
        qs = qs.map(q => {
          if (q.isShuffle && q.options) {
            // Shuffle options shallow copy
            return { ...q, options: [...q.options].sort(() => Math.random() - 0.5) };
          }
          return q;
        });
        setQuestions(qs);
        setLoading(false);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load exam.");
      }
    };
    initExam();
  }, [testId, navigate]);

  // === Timer & Auto Submit ===
  useEffect(() => {
    if (testStarted && test) {
      let storedStart = localStorage.getItem(`exam-start-${testId}`);
      if (!storedStart) {
        storedStart = Date.now();
        localStorage.setItem(`exam-start-${testId}`, storedStart);
      }
      const endTime = parseInt(storedStart) + (test.duration * 60 * 1000);

      const timer = setInterval(() => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) {
          clearInterval(timer);
          setTimeLeft("00:00");
          handleForceSubmit("Time limit reached");
        } else {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, test]);


  // === Answer Handling ===
  const handleOptionChange = (qId, type, value, checked) => {
    setAnswers(prev => {
      const currentAns = prev[qId] || { selectedOptions: [] };
      let newSelected = currentAns.selectedOptions || [];

      if (type === 'mcq' || type === 'true-false' || type === 'dropdown') {
        newSelected = [value]; // Single select
      } else if (type === 'checkboxes') {
        if (checked) {
          newSelected = [...newSelected, value];
        } else {
          newSelected = newSelected.filter(id => id !== value);
        }
      }

      return {
        ...prev,
        [qId]: { ...currentAns, selectedOptions: newSelected }
      };
    });
  };

  const handleTextChange = (qId, text) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], textAnswer: text }
    }));
  };

  const handleFileChange = (qId, file) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], file: file }
    }));
  };

  // === Submission ===
  const handleSubmit = async () => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('testId', testId);
      formData.append('studentEmail', email);
      formData.append('studentName', name);

      // Prepare answers JSON (excluding raw file objects to stay clean)
      const answersMetadata = Object.keys(answers).map(qId => ({
        questionId: qId,
        selectedOptions: answers[qId].selectedOptions,
        textAnswer: answers[qId].textAnswer,
        // No file object here, strictly metadata or nothing
      }));

      formData.append('answers', JSON.stringify(answersMetadata));

      // Append Files separately
      Object.keys(answers).forEach(qId => {
        if (answers[qId].file) {
          formData.append(`answerFile_${qId}`, answers[qId].file);
        }
      });

      const token = localStorage.getItem('token');
      // Note: Do NOT set Content-Type manually for FormData with axios, let browser set boundary
      await axios.post('/api/tests/submit', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success("Exam Submitted Successfully!");
      localStorage.removeItem(`exam-start-${testId}`);
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Try again.");
    }
  };

  const handleForceSubmit = (reason) => {
    setIsTimeUp(true);
    toast.info(`Auto-submitting: ${reason}`);
    handleSubmit();
  };

  // === Proctoring: Models & Audio ===
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Lightweight fallback
        ]);
        setModelsLoaded(true);
        console.log("Proctoring Models Loaded");
      } catch (err) {
        console.error("Error loading models", err);
      }
    };
    loadModels();
  }, []);

  // === Proctoring: Continuous Monitoring ===
  useEffect(() => {
    if (!testStarted || isSubmitModalOpen || isTimeUp || !modelsLoaded) return;

    // 1. Audio / Noise Detection
    let audioContext;
    let microphone;
    let analyser;
    let javascriptNode;
    let faceInterval;

    const initProctoring = async () => {
      // Only start Audio/Face if Biometric is Enabled
      if (!test?.biometricEnabled) return;

      // Audio Setup
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

          analyser.smoothingTimeConstant = 0.8;
          analyser.fftSize = 1024;

          microphone.connect(analyser);
          analyser.connect(javascriptNode);
          javascriptNode.connect(audioContext.destination);

          javascriptNode.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
              values += array[i];
            }
            const average = values / length;

            if (average > 30) {
              setWarningCount(prev => prev + 1);
              console.log("Noise Detected");
              toast.warn("🎤 Noise Detected! Please maintain silence.", { containerId: "exam-toast", autoClose: 2000 });
            }
          };
        } catch (e) {
          console.error("Audio detection failed", e);
        }
      };
      initAudio();

      // Face Detection Loop
      faceInterval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

          if (detections.length === 0) {
            console.log("No Face Detected");
            setWarningCount(prev => prev + 1);
            toast.warn("🚫 No Face Detected! Stay in the camera frame.", { containerId: "exam-toast", autoClose: 2000, theme: "colored" });
          } else if (detections.length > 1) {
            console.log("Multiple Faces Detected");
            setWarningCount(prev => prev + 1);
            toast.error("⚠️ Multiple Faces Detected! Malpractice recorded.", { containerId: "exam-toast", autoClose: 3000, theme: "colored" });
          }
        }
      }, 4000);
    };

    initProctoring();

    // 3. System Locks (Focus, Fullscreen, Copy/Paste)
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        console.log("Fullscreen Exit");
        setWarningCount(prev => prev + 1);
        toast.warn("⚠️ Fullscreen exit detected! Return immediately.", { containerId: "exam-toast", theme: "colored" });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Visibility Change (Tab Switch)");
        setWarningCount(prev => prev + 1);
        toast.error("🚫 Tab Switch detected!", { containerId: "exam-toast", theme: "colored" });
      }
    };

    const handleWindowBlur = () => {
      console.log("Window Blur");
      setWarningCount(prev => prev + 1);
      toast.error("🚫 Focus lost!", { containerId: "exam-toast", theme: "colored" });
    };

    // Block Copy/Paste/Context
    const preventCopyPaste = (e) => {
      e.preventDefault();
      toast.warn("🚫 Copy/Paste is disabled during the exam.", { containerId: "exam-toast" });
    };
    const preventRightClick = (e) => {
      e.preventDefault();
      // No toast for right click to avoid spam, just block
    };
    const preventKeys = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.warn("🚫 Systems Shortcuts are disabled.", { containerId: "exam-toast" });
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventKeys);

    return () => {
      if (faceInterval) clearInterval(faceInterval);
      if (audioContext) audioContext.close();
      if (microphone) microphone.disconnect();
      if (javascriptNode) javascriptNode.disconnect();

      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeys);
    };
  }, [testStarted, isSubmitModalOpen, isTimeUp, modelsLoaded, test]);


  // === Enforcement: Auto-Submit on Warnings ===
  useEffect(() => {
    if (warningCount >= 5) {
      handleForceSubmit("Limit exceeded: Too many malpractice warnings.");
    }
  }, [warningCount]);

  // === Start Exam Function ===
  const startExam = async () => {
    try {
      // Use Wrapper Ref for Fullscreen
      if (wrapperRef.current) {
        await wrapperRef.current.requestFullscreen();
        setTestStarted(true);
      }
    } catch (err) {
      alert("Fullscreen required to start.");
      console.error(err);
    }
  };

  // === Render ===

  if (loading) return <div className="exam-loading">Loading Exam...</div>;

  return (
    <div ref={wrapperRef} className="exam-page-wrapper">
      {!testStarted ? (
        <div className="exam-intro-screen">
          <div className="intro-card">
            <h1>{test?.title}</h1>
            <p>{test?.description}</p>
            <div className="exam-meta">
              <span>⏱️ Duration: {test?.duration} mins</span>
              <span>❓ Questions: {questions.length}</span>
            </div>
            <ul className="rules-list">
              <li>Fullscreen is mandatory.</li>
              <li>Do not switch tabs.</li>
              <li>Do not switch tabs.</li>
              {test?.biometricEnabled && <li>Face monitoring is active.</li>}
              {test?.biometricEnabled && <li>Noise detection is active.</li>}
              <li>No Copy/Paste allowed.</li>
              <li>No Copy/Paste allowed.</li>
            </ul>
            <button className="start-btn" onClick={startExam}>Start Exam</button>
          </div>
        </div>
      ) : (
        <div className="exam-ui-container">
          {/* Header Bar */}
          <div className="exam-header glass-panel">
            <div className="timer-badge" style={{ color: timeLeft === "00:00" ? 'red' : 'inherit' }}>
              ⏳ {timeLeft}
            </div>

            <div className="title-stack">
              <h4 className="exam-title-header">{test?.title}</h4>
              <span className="exam-subtitle">by {name}</span>
            </div>

            <div className="proctor-status" style={{ background: warningCount > 0 ? '#fee2e2' : '#ecfdf5', color: warningCount > 0 ? '#ef4444' : '#10b981', border: warningCount > 0 ? '1px solid #fecaca' : '1px solid #d1fae5' }}>
              <span className="rec-dot" style={{ backgroundColor: warningCount > 0 ? '#ef4444' : '#10b981' }}></span>
              {warningCount > 0 ? `Warnings: ${warningCount}/5` : 'Live Monitoring'}
            </div>

            <button className="submit-top-btn" onClick={() => setIsSubmitModalOpen(true)}>Submit</button>
          </div>

          {test?.description && (
            <div className="exam-info-card glass-card">
              <p>{test?.description}</p>
            </div>
          )}

          {/* Questions Area */}
          <div className="questions-feed">
            {questions.map((q, idx) => {
              const qId = (q._id ? q._id.toString() : null) || q.id || q.questionId || idx;
              return (
                <div key={qId} className={`exam-question-card ${q.type === 'section' ? 'section-card' : ''}`}>

                  {q.type === 'section' ? (
                    <>
                      <h2>{q.text}</h2>
                      <p>{q.explanation}</p>
                    </>
                  ) : (
                    <>
                      {q.image && <img src={`http://localhost:5000${q.image}`} className="q-image" alt="Visual" />}

                      <h3 className="q-text">
                        <span className="q-num">{idx + 1}.</span> {q.text}
                        {q.required && <span className="req-star">*</span>}
                      </h3>
                      <div className="q-points-badge">{q.points} points</div>

                      <div className="options-area">
                        {["mcq", "true-false", "radio"].includes(q.type) && q.options?.map((opt, idx) => {
                          const optId = opt.id || (opt._id ? opt._id.toString() : `opt_${idx}`);
                          return (
                            <label key={optId} className="radio-option">
                              <input
                                type="radio"
                                name={qId}
                                value={optId}
                                checked={answers[qId]?.selectedOptions?.includes(optId) || false}
                                onChange={(e) => handleOptionChange(qId, q.type, optId)}
                              />
                              <span className="opt-text">{opt.text}</span>
                            </label>
                          );
                        })}

                        {q.type === "checkboxes" && q.options?.map((opt, idx) => {
                          const optId = opt.id || (opt._id ? opt._id.toString() : `opt_${idx}`);
                          return (
                            <label key={optId} className="checkbox-option">
                              <input
                                type="checkbox"
                                value={optId}
                                checked={answers[qId]?.selectedOptions?.includes(optId) || false}
                                onChange={(e) => handleOptionChange(qId, q.type, optId, e.target.checked)}
                              />
                              <span className="opt-text">{opt.text}</span>
                            </label>
                          );
                        })}

                        {q.type === "dropdown" && (
                          <select
                            className="exam-select"
                            onChange={(e) => handleOptionChange(qId, q.type, e.target.value)}
                            value={answers[qId]?.selectedOptions?.[0] || ""}
                          >
                            <option value="">Select an answer...</option>
                            {q.options?.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.text}</option>
                            ))}
                          </select>
                        )}

                        {q.type === "short-answer" && (
                          <input
                            type="text"
                            className="text-answer-input short-answer"
                            placeholder="Type your answer here..."
                            value={answers[qId]?.textAnswer || ""}
                            onChange={(e) => handleTextChange(qId, e.target.value)}
                          />
                        )}

                        {q.type === "paragraph" && (
                          <textarea
                            className="text-answer-input paragraph"
                            placeholder="Type your full answer here..."
                            rows={12}
                            value={answers[qId]?.textAnswer || ""}
                            onChange={(e) => handleTextChange(qId, e.target.value)}
                          />
                        )}

                        {q.type === "file" && (
                          <div className="file-upload-question">
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(qId, e.target.files[0])}
                              className="file-input-field"
                            />
                            {answers[qId]?.file && (
                              <div className="file-selected-badge">
                                📎 {answers[qId].file.name}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating Webcam (Only if Biometric Enabled) */}
          {test?.biometricEnabled && (
            <div className="pip-webcam">
              <Webcam
                ref={webcamRef}
                audio={false}
                className="webcam-video"
                videoConstraints={{ facingMode: "user" }}
              />
            </div>
          )}

          {/* Submit Modal */}
          {isSubmitModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content glass-card">
                <h3>Ready to Submit?</h3>
                <p>You cannot change your answers after submission.</p>
                <div className="modal-actions">
                  <button className="cancel-btn" onClick={() => setIsSubmitModalOpen(false)}>Cancel</button>
                  <button className="confirm-btn" onClick={handleSubmit}>Yes, Submit</button>
                </div>
              </div>
            </div>
          )}

          <ToastContainer
            containerId="exam-toast"
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      )}
    </div>
  );
};

export default ExamPage;
