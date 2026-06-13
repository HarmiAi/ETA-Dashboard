require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const taskRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');
const Task = require('./models/Task');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins for local development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Set up API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.io integration
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

// Store socket io instance on the app to access in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eta-dashboard';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB database connected successfully to:', mongoURI))
  .catch(err => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });

// Server-Side Scheduling Logic: Overdue & Alarm cron job
// Runs every minute to find tasks whose ETA has passed and trigger alarms
cron.schedule('* * * * *', async () => {
  console.log('Running background task checker...');
  try {
    const now = new Date();
    
    // Find tasks that are not Completed, not yet marked Overdue, and their ETA has passed
    const tasksToNotify = await Task.find({
      status: { $in: ['Not Started', 'In Progress'] },
      eta: { $lte: now },
      notified: false
    }).populate('employeeId', 'name email department designation');

    for (const task of tasksToNotify) {
      task.status = 'Overdue';
      task.notified = true;
      task.history.push({
        status: 'Overdue',
        eta: task.eta,
        reason: 'Automated Overdue Detection: Task ETA reached without completion.',
      });
      await task.save();

      console.log(`Alert: Task "${task.title}" for employee "${task.employeeId.name}" is overdue!`);

      // Emit ETA reached event to all connected socket clients
      io.emit('etaReached', task);
    }
  } catch (err) {
    console.error('Error in background cron scheduler:', err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
