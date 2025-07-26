// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './pages/Homepage';
import BackButton from './components/BackButton/BackButton';
import Register from './pages/Register';
import Login from './pages/Login';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import CreateTest from './pages/CreateTest';
import AdminDashboard from './pages/AdminDashboard';
import JoinTestPage from './pages/JoinTestPage';
import FaceVerificationPage from './pages/FaceVerificationPage';
import ManageTests from './pages/ManageTests';
import ManageUsers from './pages/ManageUsers';
import Reports from './pages/Reports';
import PageNotFound from "./pages/PageNotFound";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './components/PrivateRoute';
import ExamPage from './pages/ExamPage';
import PrivateExamRoute from './routes/PrivateExamRoute';

function AppRoutes() {
  const location = useLocation();

  const hiddenPaths = [
    '/',
    '/blog',
    '/pricing',
    '/contact',
    '/admin'
    // '/admin/dashboard',
    // '/dashboard'
  ];

  const shouldHideBackButton =
    location.pathname.startsWith('/exam') ||
    hiddenPaths.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      {!shouldHideBackButton && <BackButton />}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/create-test" element={<PrivateRoute allowedRoles={['admin']}><CreateTest /></PrivateRoute>} />
        <Route path="/admin/tests/create" element={<PrivateRoute allowedRoles={['admin']}><CreateTest /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/invite" element={<JoinTestPage />} />
        <Route path="/face-verification" element={<FaceVerificationPage />} />
        <Route path="/admin/tests" element={<PrivateRoute><ManageTests /></PrivateRoute>} />
        <Route path="/admin/manage-users/:testId" element={<ManageUsers />} />
        <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/exam/:testId" element={<PrivateExamRoute><ExamPage /></PrivateExamRoute>} />
        <Route path="/report/:testId" element={<Reports />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
