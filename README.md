# Muhafiz – Advanced and Automated Proctoring Solution

Muhafiz is an intelligent proctoring platform designed to simplify and secure online examinations using facial recognition, behavior monitoring, and integration with Google/Microsoft Forms. It empowers administrators to monitor test-takers and ensure exam integrity with minimal manual intervention.

## Features

- 🔐 **OTP-based Email Verification** for secure login and registration
- 👤 **Face Verification** to authenticate the test-taker before exam
- 📸 **Live Webcam Feed** during exams for real-time monitoring
- 💻 **Fullscreen + Tab Switch Detection** to prevent cheating
- 🧠 **AI-based Cheating Detection (planned)**: face cover, multiple faces, etc.
- ⏳ **Auto Timer & Auto-Submission**
- 📨 **Email-based Invite Codes** to join specific tests
- 📝 **Google/Microsoft Form Integration** for flexible test creation
- 📊 **Attendance Tracking & Reporting**
- 🛡️ **Admin-only Dashboard**

---

## 🛠️ Tech Stack

- **Frontend**: React.js, CSS, XML
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT, OTP via email
- **Face Recognition**: face-api.js
- **Email Service**: Nodemailer

---

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/71101259anshu/Muhafiz.git
cd Muhafiz

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

