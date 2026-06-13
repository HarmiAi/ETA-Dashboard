const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all employee routes
router.use(authMiddleware);

// @route   GET api/employees
// @desc    Get all employees
// @access  Private
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/employees
// @desc    Add a new employee
// @access  Private
router.post('/', async (req, res) => {
  const { name, email, department, designation } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    let employee = await Employee.findOne({ email });
    if (employee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    employee = new Employee({
      name,
      email,
      department,
      designation,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/employees/:id
// @desc    Update an employee
// @access  Private
router.put('/:id', async (req, res) => {
  const { name, email, department, designation, active } = req.body;

  try {
    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check email uniqueness if email is changing
    if (email && email !== employee.email) {
      const emailExists = await Employee.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }
    }

    employee.name = name || employee.name;
    employee.email = email || employee.email;
    employee.department = department !== undefined ? department : employee.department;
    employee.designation = designation !== undefined ? designation : employee.designation;
    employee.active = active !== undefined ? active : employee.active;

    await employee.save();
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/employees/:id
// @desc    Delete an employee and their tasks
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete all tasks associated with this employee
    await Task.deleteMany({ employeeId: req.params.id });
    
    // Delete the employee
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee and associated tasks deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
