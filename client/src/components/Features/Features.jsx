import React from "react";
import "./Features.css";

const Features = () => {
  return (
    <section className="features-container">
      <div className="features">
        <div className="feature-card">
          <i className="fas fa-user-check"></i>
          <h3>Face Verification</h3>
          <p>Confirms the identity of the candidate by AI facial matching.</p>
        </div>
        <div className="feature-card">
          <i className="fas fa-users"></i>
          <h3>Multiple People Detection</h3>
          <p>Alerts when more than one person appears during the exam session.</p>
        </div>
        <div className="feature-card">
          <i className="fas fa-microphone-alt-slash"></i>
          <h3>Voice Detection</h3>
          <p>Detects background noise or voice for possible cheating attempts.</p>
        </div>
        <div className="feature-card">
          <i className="fas fa-expand"></i>
          <h3>Full Screen Check</h3>
          <p>Ensures the test is attempted in full screen to avoid switching.</p>
        </div>
        <div className="feature-card">
          <i className="fas fa-window-restore"></i>
          <h3>Multiple Tabs Check</h3>
          <p>Monitors and flags if multiple tabs or windows are accessed.</p>
        </div>
        <div className="feature-card">
          <i className="fas fa-user-secret"></i>
          <h3>Face Cover Check</h3>
          <p>Detects if the face is covered with masks, books, or hands.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;
