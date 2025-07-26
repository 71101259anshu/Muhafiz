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

// ✅ API Routes
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api', contactRoutes);



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
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
