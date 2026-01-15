const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Route imports
const userRoutes = require('./routes/userRoutes');
const testRoutes = require('./routes/testRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const contactRoutes = require('./routes/contactRoutes');
const classRoutes = require('./routes/classRoutes');
const postRoutes = require('./routes/postRoutes');

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middlewares
app.use(cors({
  origin: 'http://localhost:3000', // allow frontend dev server
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ✅ Static folders for descriptors and models
app.use('/faces', express.static(path.join(__dirname, 'faces')));
app.use('/models', express.static(path.join(__dirname, 'models'))); // optional
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ✅ API Routes
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api', contactRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/classwork', require('./routes/classworkRoutes'));


// ✅ Face verification test route
app.post('/api/face/verify', (req, res) => {
  console.log("Received face verification request:", req.body);
  // For now, always return success (testing only)
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.send('Welcome to Muhafiz Backend');
});

// ✅ Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// ✅ Make io globally available
global.io = io;

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinExam', ({ testId, email }) => {
    const room = `${testId}-${email}`;
    socket.join(room);
    console.log(`User ${email} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
