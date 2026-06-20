const mongoose = require('mongoose');

const TaskHistorySchema = new mongoose.Schema({
  status: String,
  eta: Date,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  reason: String,
});

const TaskSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  eta: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Overdue', 'On Hold'],
    default: 'Not Started',
  },
  notified: {
    type: Boolean,
    default: false,
  },
  history: [TaskHistorySchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', TaskSchema);
