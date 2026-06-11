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
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';

import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import CreateTest from './pages/CreateTest';
import AdminDashboard from './pages/AdminDashboard';
import JoinTestPage from './pages/JoinTestPage';
import ClassroomDashboard from './pages/ClassroomDashboard';
import CreateClass from './pages/CreateClass';
import JoinClass from './pages/JoinClass';
import ClassDetails from './pages/ClassDetails';
import ClassAttendance from './pages/ClassAttendance';
import FaceVerificationPage from './pages/FaceVerificationPage';
import ManageTests from './pages/ManageTests';
import ManageUsers from './pages/ManageUsers';
import ManageClassUsers from './pages/ManageClassUsers';
import Reports from './pages/Reports';
import PageNotFound from "./pages/PageNotFound";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './components/PrivateRoute';
import ExamPage from './pages/ExamPage';
import PrivateExamRoute from './routes/PrivateExamRoute';
import StudentResult from './pages/StudentResult';
import SmoothScroll from './components/SmoothScroll';

// Routes Configuration

function AppRoutes() {
    const location = useLocation();

    const hiddenPaths = [
        '/',
        '/blog',
        '/pricing',
        '/contact',
        '/admin',
        '/create-test',
        '/admin/tests/create',
        '/admin/tests'
        // '/admin/dashboard',
        // '/dashboard'
    ];

    const shouldHideBackButton =
        location.pathname.startsWith('/exam') ||
        location.pathname.startsWith('/admin/manage-users') ||
        location.pathname.startsWith('/report') ||
        location.pathname.startsWith('/face-verification') ||
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
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/faq" element={<FAQ />} />

                <Route path="/create-test" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><CreateTest /></PrivateRoute>} />
                <Route path="/admin/tests/create" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><CreateTest /></PrivateRoute>} />
                <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><AdminDashboard /></PrivateRoute>} />
                <Route path="/invite" element={<JoinTestPage />} />
                <Route path="/face-verification" element={<FaceVerificationPage />} />
                <Route path="/admin/tests" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><ManageTests /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><ManageClassUsers /></PrivateRoute>} />
                <Route path="/admin/manage-users/:testId" element={<ManageUsers />} />
                <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><AdminDashboard /></PrivateRoute>} />
                <Route path="/dashboard" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><AdminDashboard /></PrivateRoute>} />
                <Route path="/classroom" element={<PrivateRoute><ClassroomDashboard /></PrivateRoute>} />
                <Route path="/create-class" element={<PrivateRoute allowedRoles={['admin', 'teacher']}><CreateClass /></PrivateRoute>} />
                <Route path="/join-class" element={<PrivateRoute><JoinClass /></PrivateRoute>} />
                <Route path="/class/:id" element={<PrivateRoute><ClassDetails /></PrivateRoute>} />
                <Route path="/class/:classId/attendance" element={<PrivateRoute><ClassAttendance /></PrivateRoute>} />
                <Route path="/exam/:testId" element={<PrivateExamRoute><ExamPage /></PrivateExamRoute>} />
                <Route path="/report/:testId" element={<Reports />} />
                <Route path="/result/:resultId" element={<PrivateRoute><StudentResult /></PrivateRoute>} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <SmoothScroll>
                <AppRoutes />
            </SmoothScroll>
        </Router>
    );
}

export default App;
