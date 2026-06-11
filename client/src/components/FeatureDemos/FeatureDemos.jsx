import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlay, 
  FaPause, 
  FaUndo, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaPlusCircle, 
  FaShieldAlt, 
  FaMousePointer, 
  FaCheck, 
  FaUser, 
  FaTimes, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import './FeatureDemos.css';

const FeatureDemos = () => {
  const [activeTab, setActiveTab] = useState('create-quiz'); // 'create-quiz' or 'proctoring'
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef(null);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0; // Loop play
          }
          return prev + 0.5; // Tick speed
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Reset progress when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleProgressChange = (e) => {
    setProgress(parseFloat(e.target.value));
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  const formatTime = (percent) => {
    const totalSeconds = 20;
    const currentSeconds = Math.floor((percent / 100) * totalSeconds);
    const mins = Math.floor(currentSeconds / 60).toString().padStart(2, '0');
    const secs = (currentSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Steps calculator
  const getActiveStep = () => {
    if (progress < 25) return 0;
    if (progress < 50) return 1;
    if (progress < 75) return 2;
    return 3;
  };

  const activeStepIndex = getActiveStep();

  // Data for create-quiz demo sequence
  const quizSteps = [
    { title: "Opening Teacher Dashboard", desc: "Access the course builder portal to initialize quiz settings." },
    { title: "Typing Quiz Details", desc: "Specify title, class sections, time limits, and instructions." },
    { title: "Building Questions & Choices", desc: "Add multiple-choice questions, mark correct answers, and set marks." },
    { title: "Publishing Instantly", desc: "Distribute the quiz immediately to all students or schedule for later." }
  ];

  // Data for proctoring demo sequence
  const proctorSteps = [
    { title: "Verifying Face Identity", desc: "Auto-scan face biometric mapping to prevent student impersonation." },
    { title: "Active Attendance Check", desc: "Ensure student remains logged in and present throughout the test." },
    { title: "Detecting Tab Switches", desc: "Instantly detect when a student tries to navigate away or open search tabs." },
    { title: "Suspending / Flagging Session", desc: "Flag cheating behaviors and compile proctor logs for the administrator." }
  ];

  const currentSteps = activeTab === 'create-quiz' ? quizSteps : proctorSteps;

  // Render sub-simulations
  const renderQuizSimulation = () => {
    // Typing text calculation for step 2
    let typedTitle = "";
    if (progress >= 25 && progress < 50) {
      const text = "Mid-Term Physics Assessment";
      const ratio = (progress - 25) / 20; // 0 to 1 over step range
      const charCount = Math.floor(ratio * text.length);
      typedTitle = text.substring(0, charCount);
    } else if (progress >= 50) {
      typedTitle = "Mid-Term Physics Assessment";
    }

    return (
      <div className="sim-screen quiz-sim-screen">
        {/* Top Navbar */}
        <div className="sim-navbar">
          <span className="sim-logo">⚡ Kvizroom</span>
          <span className="sim-badge">Teacher Portal</span>
        </div>

        {/* Dashboard Main View */}
        <div className="sim-main-layout">
          {/* Sidebar */}
          <div className="sim-sidebar">
            <div className="sim-sidebar-item active">🏫 Classroom</div>
            <div className="sim-sidebar-item">📝 Quizzes</div>
            <div className="sim-sidebar-item">📊 Reports</div>
          </div>

          {/* Active Workspace */}
          <div className="sim-body">
            {/* Step 1: Dashboard Home and Create button */}
            {activeStepIndex === 0 && (
              <div className="sim-step-container">
                <div className="sim-dashboard-header">
                  <h4>Physics - Sec B</h4>
                  <button className="sim-btn-primary glow-btn">
                    + Create Quiz
                  </button>
                </div>
                <div className="sim-card-list">
                  <div className="sim-card">Recent Quiz: Homework 3 (Published)</div>
                  <div className="sim-card">Recent Quiz: Test 1 (Graded)</div>
                </div>

                {/* Animated Cursor */}
                <motion.div 
                  className="sim-cursor"
                  animate={{ x: [250, 190, 190], y: [160, 25, 25], scale: [1, 1, 0.9, 1] }}
                  transition={{ duration: 4, times: [0, 0.6, 0.7, 0.8], repeat: Infinity }}
                >
                  <FaMousePointer />
                </motion.div>
              </div>
            )}

            {/* Step 2: Form Entry */}
            {activeStepIndex === 1 && (
              <div className="sim-step-container fade-in">
                <h5>Create New Assessment</h5>
                <div className="sim-form-group">
                  <label>Quiz Title</label>
                  <div className="sim-input-box">
                    {typedTitle}<span className="sim-caret">|</span>
                  </div>
                </div>
                <div className="sim-form-row">
                  <div className="sim-form-group">
                    <label>Duration</label>
                    <div className="sim-input-box-small">45 Mins</div>
                  </div>
                  <div className="sim-form-group">
                    <label>Passing %</label>
                    <div className="sim-input-box-small">50%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Question Setup */}
            {activeStepIndex === 2 && (
              <div className="sim-step-container fade-in">
                <h5>Add Question #1</h5>
                <div className="sim-question-card">
                  <p className="sim-q-text">What is the SI unit of Force?</p>
                  <div className="sim-options">
                    <div className="sim-opt-item"><span className="sim-checkbox"></span> Joule</div>
                    <div className="sim-opt-item checked"><span className="sim-checkbox checked"><FaCheck /></span> Newton</div>
                    <div className="sim-opt-item"><span className="sim-checkbox"></span> Pascal</div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Publish Confirmation */}
            {activeStepIndex === 3 && (
              <div className="sim-step-container fade-in">
                {progress < 88 ? (
                  <div className="sim-publish-flow">
                    <h5>Preview & Publish</h5>
                    <div className="sim-summary-info">
                      <p>Title: <strong>Mid-Term Physics Assessment</strong></p>
                      <p>Questions: <strong>15 Items</strong> | Duration: <strong>45 Mins</strong></p>
                    </div>
                    <button className="sim-btn-success glow-btn-green align-center">
                      Publish Quiz Now
                    </button>
                    {/* cursor clicks button */}
                    <motion.div 
                      className="sim-cursor"
                      animate={{ x: [180, 110, 110], y: [130, 100, 100], scale: [1, 1, 0.9, 1] }}
                      transition={{ duration: 3, times: [0, 0.5, 0.6, 0.7], repeat: Infinity }}
                    >
                      <FaMousePointer />
                    </motion.div>
                  </div>
                ) : (
                  <div className="sim-success-card text-center scale-in">
                    <div className="sim-success-icon">🎉</div>
                    <h5>Quiz Published!</h5>
                    <p>Successfully distributed to 42 enrolled students.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProctoringSimulation = () => {
    return (
      <div className="sim-screen proctor-sim-screen">
        {/* Top Navbar */}
        <div className="sim-navbar dark-nav">
          <span className="sim-logo text-red">🔒 Kvizroom Secure Proctor</span>
          <span className="sim-badge badge-red">AI Agent Online</span>
        </div>

        {/* Proctor split screen */}
        <div className="proctor-layout">
          {/* Left: Student Web Cam */}
          <div className="proctor-video-container">
            <div className="proctor-camera-card">
              {/* Webcam viewport */}
              <div className="proctor-webcam">
                <div className="webcam-user-icon">
                  <FaUser className="user-silhouette" />
                </div>

                {/* Step 1: Scanning radar overlay */}
                {activeStepIndex === 0 && (
                  <div className="scan-overlay">
                    <div className="scan-radar-line"></div>
                    <span className="scan-label animate-pulse">BIOMETRIC SCANNING...</span>
                  </div>
                )}

                {/* Step 2: Verification complete (Green bounding box) */}
                {activeStepIndex === 1 && (
                  <div className="scan-verified-border">
                    <div className="face-bounding-box"></div>
                    <span className="verified-label">✓ IDENTITY MATCHED</span>
                  </div>
                )}

                {/* Step 3: Tab switch warning (Red flash overlay) */}
                {activeStepIndex === 2 && (
                  <div className="proctor-warning-overlay">
                    <FaExclamationTriangle className="warning-icon-animate" />
                    <span className="warning-title">WARNING!</span>
                    <span className="warning-desc">Tab Switch Detected (1/3)</span>
                  </div>
                )}

                {/* Step 4: Final Flagged session */}
                {activeStepIndex === 3 && (
                  <div className="proctor-flagged-overlay">
                    <FaTimes className="flagged-icon-animate" />
                    <span className="flagged-title font-bold">SESSION SUSPENDED</span>
                    <span className="flagged-desc">Admin review required.</span>
                  </div>
                )}
              </div>
              <div className="webcam-header">
                <span>Cam Stream #042</span>
                <span className="live-dot animate-pulse">● LIVE</span>
              </div>
            </div>
          </div>

          {/* Right: AI Proctor Dashboard logs */}
          <div className="proctor-dashboard">
            <h6 className="dashboard-title">System Logs</h6>
            <div className="proctor-logs">
              <div className="log-row success-log">
                <span className="log-time">10:00:02</span>
                <span className="log-msg">Identity scan started</span>
              </div>
              
              {activeStepIndex >= 1 && (
                <div className="log-row success-log fade-in">
                  <span className="log-time">10:00:05</span>
                  <span className="log-msg">Face match: 98.4% success</span>
                </div>
              )}

              {activeStepIndex >= 2 && (
                <div className="log-row danger-log fade-in">
                  <span className="log-time">10:01:12</span>
                  <span className="log-msg">Alert: Tab Switch Detected (Physics Test)</span>
                </div>
              )}

              {activeStepIndex >= 3 && (
                <div className="log-row critical-log fade-in">
                  <span className="log-time">10:02:40</span>
                  <span className="log-msg">Session Flagged: High Suspicion Index</span>
                </div>
              )}
            </div>

            {/* AI Status summary card */}
            <div className="ai-summary-card">
              <span>Security Score:</span>
              {activeStepIndex === 0 && <strong className="text-gray">Scanning...</strong>}
              {activeStepIndex === 1 && <strong className="text-green">99% Clean</strong>}
              {activeStepIndex === 2 && <strong className="text-orange">75% Caution</strong>}
              {activeStepIndex === 3 && <strong className="text-red">Suspended</strong>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="feature-demos-section">
      <div className="demos-container">
        
        {/* Header Title */}
        <div className="demos-header text-center">
          <h2>See Kvizroom in Action</h2>
          <p>Explore step-by-step walkthroughs of our most powerful features designed for educators and proctors.</p>
        </div>

        {/* Tabs & Player Wrapper */}
        <div className="demos-content-grid">
          
          {/* Tabs Column */}
          <div className="demos-tabs-column">
            
            {/* Tab 1 */}
            <div 
              className={`demo-tab-card ${activeTab === 'create-quiz' ? 'active' : ''}`}
              onClick={() => handleTabChange('create-quiz')}
            >
              <div className="demo-tab-icon-wrapper purple-glow">
                <FaPlusCircle className="demo-tab-icon" />
              </div>
              <div className="demo-tab-text">
                <h4>How to Create a Quiz</h4>
                <p>Add questions, set pass marks, customize durations, and distribute assessments instantly.</p>
              </div>
            </div>

            {/* Tab 2 */}
            <div 
              className={`demo-tab-card ${activeTab === 'proctoring' ? 'active' : ''}`}
              onClick={() => handleTabChange('proctoring')}
            >
              <div className="demo-tab-icon-wrapper red-glow">
                <FaShieldAlt className="demo-tab-icon" />
              </div>
              <div className="demo-tab-text">
                <h4>AI Auto Proctoring</h4>
                <p>Prevent cheating with biometric face tracking, live session logs, and automated tab-switch warnings.</p>
              </div>
            </div>

          </div>

          {/* Player Display Column */}
          <div className="demos-player-column">
            
            {/* Glassmorphic Player Container */}
            <div className="demos-player-frame">
              {/* Browser top controls */}
              <div className="player-top-bar">
                <div className="browser-buttons">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="browser-url-bar">
                  <span>https://kvizroom.com/demo/preview</span>
                </div>
              </div>

              {/* Player Body/Screen */}
              <div className="player-screen-area">
                {activeTab === 'create-quiz' ? renderQuizSimulation() : renderProctoringSimulation()}
              </div>

              {/* Player Bottom Control Panel */}
              <div className="player-controls-panel">
                <div className="player-controls-row">
                  
                  {/* Play & Restart */}
                  <div className="control-group">
                    <button className="player-ctrl-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                      {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button className="player-ctrl-btn" onClick={handleRestart} title="Restart Walkthrough">
                      <FaUndo />
                    </button>
                  </div>

                  {/* Seek/Progress slider */}
                  <div className="timeline-container">
                    <input 
                      type="range" 
                      min="0" 
                      max="99.5" 
                      step="0.5"
                      value={progress} 
                      onChange={handleProgressChange} 
                      className="player-timeline"
                    />
                    <div className="timeline-tracker" style={{ width: `${progress}%` }}></div>
                  </div>

                  {/* Mute & Time */}
                  <div className="control-group">
                    <span className="player-time-display">
                      {formatTime(progress)} / 00:20
                    </span>
                    <button className="player-ctrl-btn" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Current Step Progression Labels */}
            <div className="demo-progression-timeline">
              {currentSteps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`progression-step-item ${activeStepIndex === idx ? 'active' : ''} ${activeStepIndex > idx ? 'completed' : ''}`}
                >
                  <span className="step-number">{idx + 1}</span>
                  <div className="step-info">
                    <h6>{step.title}</h6>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default FeatureDemos;
