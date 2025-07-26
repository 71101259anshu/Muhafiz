import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import { useNavigate, useLocation } from 'react-router-dom';
import './FaceVerificationPage.css';

export default function FaceVerificationPage() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { testId } = location.state || {};

  const handleProceed = () => {
    navigate(`/exam/${testId}`);
  };

  return (
    <div className="face-verification-container">
      <h2 className="face-title">Webcam Preview</h2>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="webcam"
      />
      <button onClick={handleProceed} className="proceed-button">
        Proceed to Test
      </button>
    </div>
  );
}
