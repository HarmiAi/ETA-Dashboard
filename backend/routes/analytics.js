const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route   GET api/analytics/performance
// @desc    Get daily and monthly performance analytics per employee
// @access  Private
router.get('/performance', async (req, res) => {
  try {
    const employees = await Employee.find({ active: true });
    const tasks = await Task.find().populate('employeeId', 'name');

    const analytics = employees.map((employee) => {
      const employeeTasks = tasks.filter(
        (t) => t.employeeId && t.employeeId._id.toString() === employee._id.toString()
      );

      const totalTasks = employeeTasks.length;
      const completedTasks = employeeTasks.filter((t) => t.status === 'Completed').length;
      const pendingTasks = employeeTasks.filter(
        (t) => t.status === 'Not Started' || t.status === 'In Progress'
      ).length;
      const overdueTasks = employeeTasks.filter((t) => t.status === 'Overdue').length;

      // Calculate on-time completions
      // A completion is on-time if the completion history entry timestamp is <= the task's ETA
      const onTimeCompletions = employeeTasks.filter((t) => {
        if (t.status !== 'Completed') return false;
        const completeLog = t.history.find((h) => h.status === 'Completed');
        if (!completeLog) return true; // Fallback
        return new Date(completeLog.updatedAt) <= new Date(t.eta);
      }).length;

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const onTimeRate = completedTasks > 0 ? Math.round((onTimeCompletions / completedTasks) * 100) : 0;

      // Filter daily (today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const todayTasks = employeeTasks.filter(
        (t) => new Date(t.eta) >= startOfToday && new Date(t.eta) <= endOfToday
      );
      const todayCompleted = todayTasks.filter((t) => t.status === 'Completed').length;

      // Filter monthly (current calendar month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthTasks = employeeTasks.filter(
        (t) => new Date(t.eta) >= startOfMonth && new Date(t.eta) <= endOfMonth
      );
      const monthCompleted = monthTasks.filter((t) => t.status === 'Completed').length;

      return {
        employeeId: employee._id,
        employeeName: employee.name,
        department: employee.department,
        designation: employee.designation,
        stats: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          onTimeCompletions,
          completionRate,
          onTimeRate,
        },
        daily: {
          total: todayTasks.length,
          completed: todayCompleted,
          pending: todayTasks.filter((t) => t.status === 'Not Started' || t.status === 'In Progress').length,
          overdue: todayTasks.filter((t) => t.status === 'Overdue').length,
        },
        monthly: {
          total: monthTasks.length,
          completed: monthCompleted,
          pending: monthTasks.filter((t) => t.status === 'Not Started' || t.status === 'In Progress').length,
          overdue: monthTasks.filter((t) => t.status === 'Overdue').length,
        },
      };
    });

    res.json(analytics);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
