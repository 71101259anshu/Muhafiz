import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackToDashboard.css';

export default function BackToDashboard() {
  const navigate = useNavigate();

  return (
    <button
      className="back-floating-btn"
      onClick={() => {
        console.log("clicked");
        navigate(-1);
      }}
    >
      ⬅ Go Back
    </button>
  );
}
