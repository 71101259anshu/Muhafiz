import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate, useParams } from "react-router-dom";
import "./FaceVerificationPage.css"; // Reusing existing styles
// import * as faceapi from "face-api.js"; // In real implementation

const ClassAttendance = () => {
    const webcamRef = useRef(null);
    const navigate = useNavigate();
    const { classId } = useParams();
    const [status, setStatus] = useState("Scan your face to mark attendance");
    const [isVerifying, setIsVerifying] = useState(false);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsVerifying(true);
        setStatus("Verifying...");

        // Mock Verification Logic
        setTimeout(() => {
            setIsVerifying(false);
            setStatus("Attendance Marked Successfully!");

            // Redirect back to class after 2 seconds
            setTimeout(() => {
                navigate(`/class/${classId}`);
            }, 2000);
        }, 1500);

    }, [webcamRef, navigate, classId]);

    return (
        <div className="face-verification-container">
            <div className="verification-box">
                <h2>Class Attendance</h2>
                <p className="status-text">{status}</p>

                <div className="webcam-wrapper">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="webcam-feed"
                    />
                    <div className="face-overlay"></div>
                </div>

                <div className="actions">
                    <button
                        className="verify-btn"
                        onClick={capture}
                        disabled={isVerifying}
                    >
                        {isVerifying ? "Verifying..." : "Mark Attendance"}
                    </button>
                    <button
                        className="cancel-btn"
                        onClick={() => navigate(`/class/${classId}`)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClassAttendance;
