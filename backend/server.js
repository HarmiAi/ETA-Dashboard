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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Set up API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);


// Root route for Render health check
app.get('/', (req, res) => {
  res.json({
    message: 'ETA Dashboard Backend is running 🚀',
    status: 'success'
  });
});


// Socket.io integration
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Mirror the requester's origin to allow credentials mode
      callback(null, origin || '*');
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store socket io instance on the app to access in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('---------------- SOCKET CONNECTION ----------------');
  console.log(`[Socket] Client connected! Socket ID: ${socket.id}`);
  console.log(`[Socket] Origin: ${socket.handshake.headers.origin || 'N/A'}`);
  console.log(`[Socket] IP Address: ${socket.handshake.address}`);
  console.log(`[Socket] Handshake Headers:`, JSON.stringify(socket.handshake.headers));
  console.log(`[Socket] Handshake Auth:`, JSON.stringify(socket.handshake.auth));
  console.log(`[Socket] Connected users:`, io.engine.clientsCount);
  console.log(`[Socket] Active Rooms:`, Array.from(io.sockets.adapter.rooms.keys()));
  console.log('----------------------------------------------------');

  socket.on('disconnect', (reason) => {
    console.log('---------------- SOCKET DISCONNECTION ----------------');
    console.log(`[Socket] Client disconnected! Socket ID: ${socket.id}`);
    console.log(`[Socket] Reason: ${reason}`);
    console.log(`[Socket] Connected users:`, io.engine.clientsCount);
    console.log('-------------------------------------------------------');
  });
});

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eta-dashboard';
mongoose.connect(mongoURI)
  .then(() => {
    console.log('MongoDB database connected successfully to:', mongoURI);
    console.log('[System Diagnostics] NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('[System Diagnostics] Server Port:', process.env.PORT || 5000);
  })
  .catch(err => {
    console.error('MongoDB database connection error:', err);
    process.exit(1);
  });

// Server-Side Scheduling Logic: Overdue & Alarm cron job
// Runs every minute to find tasks whose ETA has passed and trigger alarms
cron.schedule('* * * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[Cron Scheduler] Run trigger at: ${timestamp}`);
  try {
    const now = new Date();

    // Find tasks that are not Completed, not yet marked Overdue, and their ETA has passed
    const tasksToNotify = await Task.find({
      status: { $in: ['Not Started', 'In Progress'] },
      eta: { $lte: now },
      notified: false
    }).populate('employeeId', 'name email department designation');

    if (tasksToNotify.length > 0) {
      console.log(`[Cron Scheduler] Detected ${tasksToNotify.length} newly overdue tasks.`);
    }

    for (const task of tasksToNotify) {
      task.status = 'Overdue';
      task.notified = true;
      task.history.push({
        status: 'Overdue',
        eta: task.eta,
        reason: 'Automated Overdue Detection: Task ETA reached without completion.',
      });
      await task.save();

      console.log(`[Cron Scheduler] Task Alert: "${task.title}" for employee "${task.employeeId?.name || 'N/A'}" marked Overdue.`);

      // Emit ETA reached event to all connected socket clients
      console.log("[Socket Emit Trace]", {
        event: 'etaReached',
        targetRoom: 'global (all)',
        connectedClients: io.engine.clientsCount,
        payload: { taskId: task._id, title: task.title, eta: task.eta }
      });
      io.emit('etaReached', task);
    }
  } catch (err) {
    console.error('[Cron Scheduler] Error encountered:', err);
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
