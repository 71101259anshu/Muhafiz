import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const PrivateExamRoute = ({ children }) => {
  const { testId } = useParams();
  const isVerified = localStorage.getItem(`verified-${testId}`) === 'true';

  if (!isVerified) {
    return <Navigate to="/face-verification" replace />;
  }

  return children;
};

export default PrivateExamRoute;
