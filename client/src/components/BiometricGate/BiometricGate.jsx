import React, { useRef, useState, useEffect } from 'react';
import './BiometricGate.css';
import { FaFingerprint, FaCheckCircle, FaExclamationTriangle, FaUserLock } from 'react-icons/fa';
import * as faceapi from 'face-api.js';
import axios from 'axios';

/**
 * BiometricGate Component (REAL AI IMPLEMENTATION)
 * Matches live face against stored registration face.
 */
const BiometricGate = ({ onVerified }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('loading-models'); // loading-models, idle, scanning, verified, error, mismatch, no-data
    const [stream, setStream] = useState(null);
    const [storedDescriptor, setStoredDescriptor] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // 1. Load Models & User Data
    useEffect(() => {
        const loadResources = async () => {
            try {
                // Load FaceAPI Models
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);

                // Fetch User's Stored Face
                const token = localStorage.getItem('token');
                const res = await axios.get(`${process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL || "${process.env.REACT_APP_API_URL || "http://localhost:5000"}"}`}/api/users/biometric`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.hasBiometric && res.data.faceDescriptor.length > 0) {
                    setStoredDescriptor(new Float32Array(res.data.faceDescriptor));
                    setStatus('idle');
                    startCamera();
                } else {
                    setStatus('no-data');
                }
            } catch (err) {
                console.error("Biometric Init Error:", err);
                setStatus('error');
            }
        };

        loadResources();

        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setStatus('scanning');
        } catch (err) {
            console.error("Camera Error:", err);
            setStatus('error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    // 2. Real-time Detection Loop
    useEffect(() => {
        if (!modelsLoaded || status !== 'scanning' || !videoRef.current || !storedDescriptor) return;

        const interval = setInterval(async () => {
            if (!videoRef.current) return;

            // Detect Face
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
                console.log("Match Distance:", distance);

                // Threshold (0.6 is standard, tighter is 0.45)
                if (distance < 0.5) {
                    clearInterval(interval);
                    setStatus('verified');
                    setTimeout(() => {
                        onVerified();
                    }, 1500);
                } else {
                    // Face detected but not matching (keep scanning or show warning?)
                    // Maybe show "Scanning..." feedback
                }
            }
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [modelsLoaded, status, storedDescriptor]);

    return (
        <div className="biometric-overlay">
            <div className="biometric-card">
                <div className="biometric-header">
                    <h2><FaFingerprint /> Biometric Entry</h2>
                    <p>Facial Recognition Active</p>
                </div>

                <div className="camera-viewport">
                    {status === 'loading-models' && <div className="loading-state">Loading AI Models...</div>}

                    {status === 'no-data' && (
                        <div className="camera-error">
                            <FaUserLock size={40} />
                            <p>No Registration Face Found.</p>
                            <p style={{ fontSize: '12px' }}>Please register your face in profile settings.</p>
                            <button onClick={() => window.location.href = '/dashboard'}>Go Back</button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="camera-error">
                            <FaExclamationTriangle size={40} />
                            <p>Camera/System Error</p>
                            <button onClick={() => window.location.reload()}>Retry</button>
                        </div>
                    )}

                    {(status === 'scanning' || status === 'verified') && (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
                            {status === 'scanning' && <div className="scan-line"></div>}
                            {status === 'scanning' && <div className="scan-overlay-text">Align Face to Verify...</div>}
                        </>
                    )}

                    {status === 'verified' && (
                        <div className="verified-overlay">
                            <FaCheckCircle size={50} className="success-icon" />
                            <h3>Identity Verified</h3>
                        </div>
                    )}
                </div>

                <div className="biometric-status">
                    {status === 'loading-models' && "Preparing Secure Environment..."}
                    {status === 'idle' && "Initializing Camera..."}
                    {status === 'no-data' && "Registration Required."}
                    {status === 'scanning' && "Matching face with registration photo..."}
                    {status === 'verified' && "Access Granted. Redirecting..."}
                    {status === 'error' && "Verification Failed."}
                </div>
            </div>
        </div>
    );
};

export default BiometricGate;
