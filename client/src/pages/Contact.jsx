import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Contact.css';
import { toast } from 'react-toastify';
import axios from 'axios'; // ✅ Added

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, message } = form;

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill out all fields");
      return;
    }

    try {
      const res = await axios.post('/api/contact', form); // ✅ POST to backend
      toast.success(res.data.message || "Message sent successfully!");
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="contact-wrapper">
      <Link to="/" className="back-btn">← Back to Home</Link>
      <h1 className="contact-title">Get in Touch With Us</h1>
      <p className="contact-subtext">Have questions or need help? We’d love to hear from you.</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />
        <textarea
          name="message"
          rows="5"
          placeholder="Your Message..."
          value={form.message}
          onChange={handleChange}
          required
        ></textarea>
        <button type="submit" className="btn contact-btn">Send Message</button>
      </form>

      <div className="contact-info">
        <p><strong>Email:</strong> 6152anshudubey@gmail.com <strong>OR </strong> team.muhafiz.tech@gmail.com</p>
        <p><strong>Phone:</strong> +91-9838179812 <strong>OR </strong>+91-8602949812</p>
      </div>
    </div>
  );
};

export default Contact;
