import React, { useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './JoinTestPage.css';

export default function JoinTestPage() {

  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();

    if (!email || !inviteCode) {
      toast.error('Please fill in both email and invite code');
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/tests/validate-invite`, {
        email,
        inviteCode,
      });

      toast.success('Validation successful!');

      const { testId, name, biometricEnabled } = res.data;

      // ✅ Store in localStorage for use in ExamPage logs
      localStorage.setItem("email", email);
      localStorage.setItem("name", name);

      if (biometricEnabled) {
        // ✅ Navigate to FaceVerificationPage with testId, email, and name
        navigate('/face-verification', {
          state: {
            testId,
            email,
            name,
          },
        });
      } else {
        // ✅ Skip verification: Mark as verified and go to Exam
        localStorage.setItem(`verified-${testId}`, 'true');
        navigate(`/exam/${testId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to validate');
    }
  };

  return (
    <div className="join-test-container">
      <h2>Join Test</h2>
      <form onSubmit={handleJoin}>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Enter invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
        <button type="submit">Join</button>
      </form>
    </div>
  );
}
