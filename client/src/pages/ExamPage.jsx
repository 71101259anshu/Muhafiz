import React, { useEffect, useState, useRef } from "react";

import { useNavigate, useParams } from 'react-router-dom';
import axios from "axios";
import Webcam from "react-webcam";
import "./ExamPage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const handleSubmit = React.useCallback(async () => {
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
  }, [answers, testId, email, name, navigate]);

  const handleForceSubmit = React.useCallback((reason) => {
    setIsTimeUp(true);
    toast.info(`Auto-submitting: ${reason}`);
    handleSubmit();
  }, [handleSubmit]);

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
  }, [testStarted, test, testId, handleForceSubmit]);

  // === Proctoring: Helper Logging Function ===
  const logMalpractice = React.useCallback(async (type, message, snapshot = null) => {
    // Increment local warning count
    setWarningCount(prev => prev + 1);

    // Show Toast
    toast.warn(`⚠️ ${message}`, { containerId: "exam-toast", theme: "colored" });

    // Log to Backend
    try {
      await axios.post(`/api/tests/${testId}/log-malpractice`, {
        email,
        name,
        type,
        message,
        snapshotUrl: snapshot // If we implement snapshot later
      });
    } catch (err) {
      console.error("Failed to log malpractice", err);
    }
  }, [testId, email, name]);

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
      // Settings
      // Settings
      // Default to strict if settings are missing or empty
      let settings = test?.proctoringSettings;
      if (!settings || Object.keys(settings).length === 0) {
        settings = {
          restrictTabs: true,
          restrictFullScreen: true,
          disableCopyPaste: true,
          noiseDetection: !!test?.biometricEnabled,
          multiFaceDetection: !!test?.biometricEnabled
        };
      }

      // Audio Setup
      if (settings.noiseDetection) {
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

              // Simple Threshold
              if (average > 40) { // Slightly increased threshold
                // Debounce or Limit frequency could be added here
                console.log("Noise Detected");
                // We avoid spamming backend, maybe stick to toast or check last log time
                // For now, logging everything but maybe toast autoClose handles spam visually
                logMalpractice('noise', 'Noise Detected! Please maintain silence.');
                // Hack to prevent rapid firing: suspend audio briefly? No.
                // Ideally we'd have a cooldown.
                javascriptNode.disconnect();
                setTimeout(() => javascriptNode.connect(audioContext.destination), 3000); // 3s cooldown
              }
            };
          } catch (e) {
            console.error("Audio detection failed", e);
          }
        };
        initAudio();
      }

      // Face Detection Loop
      if (test?.biometricEnabled) {
        faceInterval = setInterval(async () => {
          if (webcamRef.current && webcamRef.current.video.readyState === 4) {
            const video = webcamRef.current.video;
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

            if (detections.length === 0) {
              logMalpractice('no_face', 'No Face Detected! Stay in frame.');
            } else if (settings.multiFaceDetection && detections.length > 1) {
              logMalpractice('multiple_faces', 'Multiple Faces Detected!');
            }
          }
        }, 5000); // Check every 5s
      }
    };

    initProctoring();

    // 3. System Locks
    // 3. System Locks
    // Default to strict if settings are missing or empty
    let settings = test?.proctoringSettings;
    if (!settings || Object.keys(settings).length === 0) {
      settings = {
        restrictTabs: true,
        restrictFullScreen: true,
        disableCopyPaste: true,
        noiseDetection: !!test?.biometricEnabled,
        multiFaceDetection: !!test?.biometricEnabled
      };
    }

    const handleFullScreenChange = () => {
      if (settings.restrictFullScreen && !document.fullscreenElement) {
        logMalpractice('fullscreen_exit', 'Fullscreen exit detected!');
      }
    };

    const handleVisibilityChange = () => {
      if (settings.restrictTabs && document.hidden) {
        logMalpractice('tab_switch', 'Tab Switch detected!');
      }
    };

    const handleWindowBlur = () => {
      if (settings.restrictTabs) {
        logMalpractice('focus_lost', 'Focus lost! Keep exam window active.');
      }
    };

    // Block Copy/Paste/Context
    const preventCopyPaste = (e) => {
      if (settings.disableCopyPaste) {
        e.preventDefault();
        toast.warn("🚫 Copy/Paste is disabled.", { containerId: "exam-toast", autoClose: 1000 });
      }
    };
    const preventRightClick = (e) => {
      if (settings.disableCopyPaste) {
        e.preventDefault();
      }
    };
    const preventKeys = (e) => {
      // Block Ctrl+C, Ctrl+V, Alt+Tab (hard to block), Win key etc.
      if (settings.disableCopyPaste) {
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          toast.warn("🚫 Systems Shortcuts disabled.", { containerId: "exam-toast", autoClose: 1000 });
        }
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
  }, [testStarted, isSubmitModalOpen, isTimeUp, modelsLoaded, test, logMalpractice]);


  // === Enforcement: Auto-Submit on Warnings ===
  useEffect(() => {
    if (warningCount >= 5) {
      handleForceSubmit("Limit exceeded: Too many malpractice warnings.");
    }
  }, [warningCount, handleForceSubmit]);

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
              {test?.proctoringSettings?.restrictFullScreen && <li>Fullscreen is mandatory.</li>}
              {test?.proctoringSettings?.restrictTabs && <li>Do not switch tabs.</li>}
              {test?.biometricEnabled && <li>Face monitoring is active.</li>}
              {test?.proctoringSettings?.noiseDetection && <li>Noise detection is active.</li>}
              {test?.proctoringSettings?.disableCopyPaste && <li>No Copy/Paste allowed.</li>}
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
                      {q.image && <img src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${q.image}`} className="q-image" alt="Visual" />}

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


        </div>
      )}
      <ToastContainer
        containerId="exam-toast"
        position="top-right"
        style={{ zIndex: 2147483647, position: 'fixed', top: '20px', right: '20px' }}
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
  );
};

export default ExamPage;
