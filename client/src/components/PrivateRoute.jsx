import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();

  // 1. Check Authentication
  if (!token || !user) {
    // Redirect to login, saving the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check Role Authorization (if allowedRoles is provided)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Unauthorized: Redirect to Home
      return <Navigate to="/" replace />;
    }
  }

  // 3. Authorized
  return children;
};

export default PrivateRoute;
