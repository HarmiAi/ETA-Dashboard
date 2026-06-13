const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all task routes
router.use(authMiddleware);

// Helper function to update task status to Overdue if it's passed ETA and not completed
const checkAndMarkOverdue = async (task) => {
  if (task.status !== 'Completed' && task.status !== 'Overdue' && new Date(task.eta) < new Date()) {
    task.status = 'Overdue';
    task.history.push({
      status: 'Overdue',
      eta: task.eta,
      reason: 'System auto-detected overdue status (ETA passed without completion)',
    });
    await task.save();
  }
  return task;
};

// @route   GET api/tasks
// @desc    Get all tasks with optional filters (employeeId, status, priority, startDate, endDate)
// @access  Private
router.get('/', async (req, res) => {
  const { employeeId, status, priority, startDate, endDate } = req.query;
  const filter = {};

  if (employeeId) filter.employeeId = employeeId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  // Date filtering based on ETA
  if (startDate || endDate) {
    filter.eta = {};
    if (startDate) filter.eta.$gte = new Date(startDate);
    if (endDate) filter.eta.$lte = new Date(endDate);
  }

  try {
    let tasks = await Task.find(filter)
      .populate('employeeId', 'name email department designation')
      .sort({ eta: 1 });

    // Check and mark overdue on the fly for returned tasks
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        return await checkAndMarkOverdue(task);
      })
    );

    res.json(updatedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/tasks
// @desc    Create/assign a new task
// @access  Private
router.post('/', async (req, res) => {
  const { employeeId, title, description, eta, priority } = req.body;

  if (!employeeId || !title || !eta) {
    return res.status(400).json({ message: 'Employee, Title, and ETA are required' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const task = new Task({
      employeeId,
      title,
      description,
      eta,
      priority,
      status: 'Not Started',
      history: [{
        status: 'Not Started',
        eta: new Date(eta),
        reason: 'Task created',
      }],
    });

    await task.save();

    // Populate employee details for response
    await task.populate('employeeId', 'name email department designation');

    // Emit live task creation event if socket is available
    if (req.app.get('io')) {
      req.app.get('io').emit('taskCreated', task);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/tasks/:id
// @desc    Update task details (title, description, priority)
// @access  Private
router.put('/:id', async (req, res) => {
  const { title, description, priority, employeeId } = req.body;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
      task.employeeId = employeeId;
    }

    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority || task.priority;

    await task.save();
    await task.populate('employeeId', 'name email department designation');
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/tasks/:id/complete
// @desc    Mark task as Completed (Follow-up action)
// @access  Private
router.post('/:id/complete', async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = 'Completed';
    task.history.push({
      status: 'Completed',
      eta: task.eta,
      reason: 'Marked Completed by Manager',
    });

    await task.save();
    await task.populate('employeeId', 'name email department designation');

    if (req.app.get('io')) {
      req.app.get('io').emit('taskUpdated', task);
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/tasks/:id/extend
// @desc    Extend task ETA with a reason (Follow-up action)
// @access  Private
router.post('/:id/extend', async (req, res) => {
  const { newEta, reason } = req.body;

  if (!newEta || !reason) {
    return res.status(400).json({ message: 'New ETA and Reason are required for extension' });
  }

  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const previousEta = task.eta;
    task.eta = new Date(newEta);
    // When extending, check if the new ETA makes it pending (In Progress or Not Started) rather than Overdue
    task.status = 'In Progress';
    task.notified = false; // Reset notification trigger since ETA changed
    
    task.history.push({
      status: 'In Progress',
      eta: new Date(newEta),
      reason: `ETA extended from ${previousEta.toISOString()} to ${new Date(newEta).toISOString()}. Reason: ${reason}`,
    });

    await task.save();
    await task.populate('employeeId', 'name email department designation');

    if (req.app.get('io')) {
      req.app.get('io').emit('taskUpdated', task);
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/tasks/:id/not-started
// @desc    Mark task as Not Started (Follow-up action)
// @access  Private
router.post('/:id/not-started', async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = 'Not Started';
    task.history.push({
      status: 'Not Started',
      eta: task.eta,
      reason: 'Marked Not Started by Manager',
    });

    await task.save();
    await task.populate('employeeId', 'name email department designation');

    if (req.app.get('io')) {
      req.app.get('io').emit('taskUpdated', task);
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    if (req.app.get('io')) {
      req.app.get('io').emit('taskDeleted', req.params.id);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.checkAndMarkOverdue = checkAndMarkOverdue;
