import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './Register.css';
import { useNavigate, Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    otp: '',
    role: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    toast.success("Photo captured successfully");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email address';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!otpSent) newErrors.otp = 'Please verify your email';
    if (!formData.otp) newErrors.otp = 'OTP is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!capturedImage) newErrors.capturedImage = 'Live photo is required';
    if (!formData.acceptedTerms) newErrors.acceptedTerms = 'You must agree to the terms';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix form errors before submitting");
      return false;
    }

    return true;
  };

  // ✅ Convert base64 to File
  const dataURLtoFile = (dataUrl, filename) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  // ✅ Upload face image using FormData
  const uploadFaceImage = async (email, capturedImageBase64) => {
    try {
      const file = dataURLtoFile(capturedImageBase64, `${email}.jpg`);
      const formData = new FormData();
      formData.append("email", email);
      formData.append("face", file);

      const res = await axios.post('http://localhost:5000/api/upload-face', formData);
      toast.success(res.data || 'Face image uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload face image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        username: formData.name,
        email: formData.email,
        password: formData.password,
        photo: capturedImage,
        otp: formData.otp,
        role: formData.role,
        acceptedTerms: formData.acceptedTerms,
      });

      // ✅ Upload face after registration
      await uploadFaceImage(formData.email, capturedImage);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      toast.success('Registered Successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const sendOtp = async () => {
    if (!formData.email.includes('@')) {
      setErrors(prev => ({ ...prev, email: 'Enter a valid email before requesting OTP' }));
      toast.error("Enter a valid email first");
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/users/send-otp', { email: formData.email });
      setOtpSent(true);
      toast.info(`OTP sent to ${formData.email}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error("Failed to send OTP");
    }
  };

  return (
    <div className="register-container">
      <Link to="/" className="back-btn">← Back to Home</Link>
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create Your Account</h2>

        <div className="input-container">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <p className="error-msg">{errors.name}</p>}

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <p className="error-msg">{errors.email}</p>}

          <button type="button" className="btn otp-btn" onClick={sendOtp}>
            {otpSent ? 'Resend OTP' : 'Send OTP'}
          </button>

          {otpSent && (
            <>
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={handleChange}
              />
              {errors.otp && <p className="error-msg">{errors.otp}</p>}
            </>
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          {errors.password && <p className="error-msg">{errors.password}</p>}

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="input-select"
          >
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <p className="error-msg">{errors.role}</p>}
        </div>

        <label className="photo-label">Live Photo Capture (Look Straight)</label>
        <div className="photo-box">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="captured-img" />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam-feed"
            />
          )}
        </div>

        {errors.capturedImage && <p className="error-msg">{errors.capturedImage}</p>}

        {isPortrait && (
          <p className="rotate-warning">🔁 Please rotate your device to landscape for better photo capture</p>
        )}

        <button
          type="button"
          className="btn capture-btn"
          onClick={() => {
            if (capturedImage) {
              setCapturedImage(null);
            } else {
              capturePhoto();
            }
          }}
        >
          {capturedImage ? 'Retake' : 'Capture'}
        </button>

        <div className="terms">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
          />
          <span>I agree to all <a href="#">Terms and Conditions</a></span>
        </div>
        {errors.acceptedTerms && <p className="error-msg">{errors.acceptedTerms}</p>}

        <button type="submit" className="btn register-btn">Register</button>

        <p className="form-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
