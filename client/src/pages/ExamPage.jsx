import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from "axios";
import Webcam from "react-webcam";
import "./ExamPage.css";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";
import { toast } from "react-toastify";
import { io } from 'socket.io-client';

const ExamPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [modalType, setModalType] = useState("start");
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(10);
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const webcamRef = useRef(null);
  const tabId = useRef(`${Date.now()}-${Math.random()}`);
  const email = localStorage.getItem("email");
  const name = localStorage.getItem("name");
  const socketRef = useRef(null);

  const logInactivity = async (message) => {
    try {
      await axios.post(`/api/tests/${testId}/log-inactivity`, {
        email,
        name,
        timestamp: `${new Date().toISOString()} - ${message}`,
      });
    } catch (err) {
      console.error("Error logging inactivity:", err);
    }
  };

  useEffect(() => {
    const fetchTest = async () => {
      const isVerified = localStorage.getItem(`verified-${testId}`) === 'true';

      if (!isVerified) {
        toast.error("You must complete face verification first.");
        navigate('/face-verification', { state: { testId } });
        return;
      }

      try {
        const res = await axios.get(`/api/tests/${testId}`);
        const testData = res.data;

        const currentTime = new Date();
        const startTime = new Date(testData.startTime);

        if (currentTime < startTime) {
          toast.error("The exam has not started yet!");
          navigate('/join-test');
        } else {
          setTest(testData);
        }
      } catch (err) {
        toast.error("Failed to load test data");
      }
    };

    fetchTest();
  }, [testId, navigate]);


  const markAttendance = async () => {
    if (!email) return;
    try {
      await axios.post(`/api/tests/${testId}/mark-attended`, { email });
    } catch (err) {
      console.error("Error marking attendance:", err.response?.data || err.message);
    }
  };

  const handleFinalSubmit = async () => {
    await markAttendance();
    localStorage.removeItem(`test-${testId}-startTime`);
    localStorage.removeItem(`verified-${testId}`);
    setTestCompleted(true);
    alert("Test submitted. Thank you!");
    navigate("/");
  };

  const handleStartTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await document.documentElement.requestFullscreen();
      const startTime = Date.now();
      localStorage.setItem(`test-${testId}-startTime`, startTime);
      setTestStarted(true);
      setModalType(null);
    } catch (err) {
      toast.error("Microphone access and fullscreen mode are required to start the test.");
    }
  };

  useEffect(() => {
    const existingStart = localStorage.getItem(`test-${testId}-startTime`);
    if (existingStart) setTestStarted(true);
  }, [testId]);

  useEffect(() => {
    if (test && testStarted) {
      let storedStartTime = localStorage.getItem(`test-${testId}-startTime`);
      if (!storedStartTime) {
        storedStartTime = Date.now();
        localStorage.setItem(`test-${testId}-startTime`, storedStartTime);
      }
      storedStartTime = parseInt(storedStartTime, 10);
      const endTime = storedStartTime + test.duration * 60 * 1000;

      const interval = setInterval(() => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) {
          clearInterval(interval);
          setTimeLeft("00:00");
          setModalType("timeout");
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [test, testStarted]);

  useEffect(() => {
    if (modalType === "timeout") {
      setAutoSubmitCountdown(10);
      const interval = setInterval(() => {
        setAutoSubmitCountdown((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [modalType]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning("⚠️ Tab switch detected!");
        logInactivity("Tab switch detected");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const TAB_KEY = `muhafiz-tab-${testId}`;
    localStorage.setItem(TAB_KEY, tabId.current);
    const handleStorageChange = (event) => {
      if (event.key === TAB_KEY && event.newValue !== tabId.current) {
        setIsDuplicateTab(true);
        toast.error("⚠️ Test already open in another tab.");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      localStorage.removeItem(TAB_KEY);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [testId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (testStarted && !testCompleted && !document.fullscreenElement) {
        toast.warn("⚠️ Exited fullscreen.");
        logInactivity("Exited fullscreen mode");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [testStarted, testCompleted]);

  useEffect(() => {
    if (!testStarted) return;
    let model, interval;
    const loadModelAndStart = async () => {
      model = await blazeface.load();
      interval = setInterval(async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const predictions = await model.estimateFaces(video, false);
          if (predictions.length === 0) {
            toast.error("⚠️ No face detected.");
            logInactivity("No face detected");
          } else if (predictions.length > 1) {
            toast.error("⚠️ Multiple faces detected.");
            logInactivity("Multiple faces detected");
          } else if ((predictions[0].landmarks || []).length < 5) {
            toast.warn("⚠️ Face unclear.");
            logInactivity("Face unclear or covered");
          }
        }
      }, 3000);
    };
    loadModelAndStart();
    return () => clearInterval(interval);
  }, [testStarted]);

  useEffect(() => {
    if (!testStarted) return;
    let audioContext, analyser, dataArray, source, interval;
    let lastVolumes = [];

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      lastVolumes.push(volume);
      if (lastVolumes.length > 10) lastVolumes.shift();

      const avg = lastVolumes.reduce((a, b) => a + b, 0) / lastVolumes.length;
      const variance = lastVolumes.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lastVolumes.length;
      const stdDev = Math.sqrt(variance);

      if (volume > 45 && stdDev > 10) {
        toast.warning("⚠️ Talking or noise detected.");
        logInactivity("Talking or noise detected");
      }
    };

    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        interval = setInterval(checkVolume, 3000);
      } catch (err) {
        toast.error("Microphone access denied.");
      }
    };

    initMic();
    return () => {
      if (interval) clearInterval(interval);
      if (audioContext) audioContext.close();
    };
  }, [testStarted]);

  useEffect(() => {
    if (!testStarted) return;
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('joinExam', { testId, email });

    socketRef.current.on('receiveWarning', (data) => {
      toast.warning(data.message || '⚠️ Warning from admin.');
    });

    socketRef.current.on('forceLogout', (data) => {
      toast.error(data.message || '❌ You were removed from the test.');
      localStorage.clear();
      navigate('/');
    });

    return () => socketRef.current.disconnect();
  }, [testStarted]);

  useEffect(() => {
    if (!testStarted) return;
    const handleBack = () => {
      toast.warning("Test ended due to back navigation.");
      logInactivity("Back navigation");
      handleFinalSubmit();
    };
    window.history.pushState(null, null, window.location.href);
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [testStarted]);

  if (!test) return <p>Loading test...</p>;

  if (isDuplicateTab) {
    return (
      <div className="exam-container">
        <h2 style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
          ⚠️ Test is already open in another tab. Please close other tabs to continue.
        </h2>
      </div>
    );
  }

  return (
    <div className="exam-container">
      {!testStarted && modalType === "start" && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>⚠️ Start Test Confirmation</h3>
            <p>
              Before you begin:
              <ul>
                <li>✔️ Fullscreen mode is required.</li>
                <li>✔️ Close all other browser tabs.</li>
                <li>✔️ Monitoring will begin immediately.</li>
              </ul>
              Click "Start Test" only when ready.
            </p>
            <div className="modal-buttons">
              <button className="submit-button" onClick={handleStartTest}>Start Test</button>
            </div>
          </div>
        </div>
      )}

      {testStarted && (
        <>
          <div className="exam-form-section">
            <h2 style={{ textAlign: "center", margin: "10px 0" }}>{test.title}</h2>
            <h4 style={{ textAlign: "center", color: "red" }}>
              Time Remaining: {timeLeft}
            </h4>
            <iframe src={test.formLink} title="Exam Form" />
            <div className="button-row">
              <button className="submit-button" onClick={() => setModalType("submit")}>Submit</button>
              <button className="end-test-button" onClick={() => setModalType("end")}>End Test</button>
            </div>
          </div>

          <div className="floating-webcam">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              width="150px"
              videoConstraints={{ facingMode: "user" }}
            />
          </div>
        </>
      )}

      {modalType && modalType !== "start" && (
        <div className="modal-overlay">
          <div className={`modal-box ${modalType === "timeout" ? "timeout" : ""}`}>
            <h3>
              {modalType === "submit"
                ? "Submit the form first, then confirm submission."
                : modalType === "end"
                  ? "Submit the form first, then confirm ending the test."
                  : `Time's up! Auto-submitting in ${autoSubmitCountdown} seconds...`}
            </h3>
            <div className="modal-buttons">
              <button onClick={handleFinalSubmit} className="submit-button">Yes</button>
              {modalType !== "timeout" && (
                <button onClick={() => setModalType(null)} className="end-test-button">Cancel</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
