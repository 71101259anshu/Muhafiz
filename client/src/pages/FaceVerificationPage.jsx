import React, { useRef, useEffect, useState } from 'react';

import Webcam from 'react-webcam';
import { useNavigate, useLocation } from 'react-router-dom';
// FIX: Use dist bundle to avoid backend issues
import * as faceapi from 'face-api.js/dist/face-api.js';
import axios from 'axios';
import './FaceVerificationPage.css';

export default function FaceVerificationPage() {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { testId } = location.state || {}; // Expect testId to be passed

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [storedDescriptor, setStoredDescriptor] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Smooth scrolling


  // 1. Load Models & User Stored Data
  useEffect(() => {
    const initBiometrics = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + '/models';
        console.log("Loading Face APIs from:", MODEL_URL);

        // Load Models
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("✅ Models loaded");


        // Fetch User's Stored Face Data
        const token = localStorage.getItem('token');
        if (!token) {
          alert("Please login first.");
          navigate('/login');
          return;
        }

        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/users/biometric`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.hasBiometric && res.data.faceDescriptor.length > 0) {
            setStoredDescriptor(new Float32Array(res.data.faceDescriptor));
            console.log("✅ User biometric data retrieved");
          } else if (res.data.photoUrl) {
            // FALLBACK: Compute descriptor from Profile Photo
            setStatusMessage("Analyzing registration photo...");
            console.log("⚠️ No descriptor found. Computing from photo...");

            let imgUrl = res.data.photoUrl;
            // If it's NOT a data URI and NOT a full URL, prepend localhost
            if (!imgUrl.startsWith('data:') && !imgUrl.startsWith('http')) {
              imgUrl = `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${imgUrl}`;
            }

            try {
              // Fetch image (works for Data URIs too)
              const img = await faceapi.fetchImage(imgUrl);
              const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

              if (detection) {
                setStoredDescriptor(detection.descriptor);
                console.log("✅ Computed descriptor from profile photo");
                setStatusMessage("");
              } else {
                setStatusMessage("Error: Could not detect a face in your registration photo.");
              }
            } catch (imgErr) {
              console.error("Error processing profile photo:", imgErr);
              setStatusMessage("Error accessing your registration photo.");
            }
          } else {
            setStatusMessage("No registration photo found. Please update your profile.");
          }
        } catch (err) {
          console.error("Failed to fetch user biometric data", err);
          setStatusMessage("Could not retrieve your registration data.");
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to init biometrics:", err);
        alert("System Error: Could not load biometric engine.");
      }
    };
    initBiometrics();
  }, [navigate]);

  const handleProceed = async () => {
    if (!webcamRef.current) return;
    setVerifying(true);
    setStatusMessage("Scanning...");

    try {
      if (!storedDescriptor) {
        alert("Cannot verify: No registration photo found on your profile.");
        setVerifying(false);
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        alert("Camera error: No image captured.");
        setVerifying(false);
        return;
      }

      // Convert base64 to HTMLImageElement for face-api
      const img = await faceapi.fetchImage(imageSrc);

      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatusMessage("No face detected. Look at the camera.");
        setVerifying(false);
        return;
      }

      // Compare!
      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
      console.log("Biometric Distance:", distance);

      // Strict threshold
      if (distance < 0.5) {
        setStatusMessage("Verified! Redirecting...");
        localStorage.setItem(`verified-${testId}`, 'true'); // Flag for exam page

        // Slight delay for UX
        setTimeout(() => {
          navigate(`/exam/${testId}`); // Go to Exam
        }, 1000);
      } else {
        setStatusMessage("Verification Failed: Face does not match profile.");
        alert("Face Mismatch! Access Denied.");
      }
    } catch (error) {
      console.error("Verification logic error:", error);
      setStatusMessage("System Error during verification.");
    }

    setVerifying(false);
  };

  return (
    <div className="face-verification-container">
      <h2 className="face-title">Webcam Preview</h2>

      <div className="webcam-wrapper">
        {loading ? (
          <p>Initializing Biometric Engine...</p>
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
          />
        )}
      </div>

      {statusMessage && <p className="status-msg" style={{ color: statusMessage.includes("Verified") ? 'green' : 'red', fontWeight: 'bold', marginTop: '10px' }}>{statusMessage}</p>}

      <button
        onClick={handleProceed}
        className="proceed-button"
        disabled={loading || verifying || !storedDescriptor}
      >
        {verifying ? 'Verifying Identity...' : 'Proceed to Test'}
      </button>
    </div>
  );
}
