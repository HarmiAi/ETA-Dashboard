require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Task = require('./models/Task');

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eta-dashboard';
    console.log('Connecting to database:', mongoURI);
    await mongoose.connect(mongoURI);

    // 1. Clear database
    console.log('Clearing old records...');
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Task.deleteMany({});

    // 2. Create Manager
    console.log('Creating Manager account...');
    const manager = new User({
      username: 'AdminManager',
      email: 'manager@company.com',
      password: 'Password123', // Will be hashed automatically by schema pre-save hook
      role: 'manager'
    });
    await manager.save();

    // 3. Create Employees
    console.log('Creating Employees...');
    const emp1 = await Employee.create({
      name: 'Alice Smith',
      email: 'alice.smith@company.com',
      department: 'Engineering',
      designation: 'Frontend Engineer'
    });

    const emp2 = await Employee.create({
      name: 'Bob Johnson',
      email: 'bob.johnson@company.com',
      department: 'Design',
      designation: 'UI/UX Designer'
    });

    const emp3 = await Employee.create({
      name: 'Charlie Brown',
      email: 'charlie.brown@company.com',
      department: 'Product',
      designation: 'Product Manager'
    });

    // 4. Create Tasks
    console.log('Creating Tasks...');
    const now = new Date();

    // Task 1: Pending (due in 3 hours)
    const eta1 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    await Task.create({
      employeeId: emp1._id,
      title: 'Complete Homepage Revamp',
      description: 'Implement glassmorphic styling and Tailwind CSS cards for the homepage UI.',
      eta: eta1,
      priority: 'High',
      status: 'In Progress',
      history: [{
        status: 'Not Started',
        eta: eta1,
        reason: 'Task assigned to Alice Smith'
      }, {
        status: 'In Progress',
        eta: eta1,
        reason: 'Alice started developing homepage assets'
      }]
    });

    // Task 2: Completed (due in 1 hour, completed 30 mins ago)
    const eta2 = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const compTask = new Task({
      employeeId: emp2._id,
      title: 'Finalize Design mockups',
      description: 'Upload high-fidelity Figma files for review.',
      eta: eta2,
      priority: 'Medium',
      status: 'Completed',
      notified: false,
    });
    compTask.history.push({
      status: 'Not Started',
      eta: eta2,
      reason: 'Task assigned'
    });
    // Mark completed 30 mins ago (which is before the 1 hour ETA deadline)
    compTask.history.push({
      status: 'Completed',
      eta: eta2,
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
      reason: 'Marked Completed by Manager'
    });
    await compTask.save();

    // Task 3: Not Started (due in 2 days)
    const eta3 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    await Task.create({
      employeeId: emp3._id,
      title: 'Prepare Release Notes',
      description: 'Document the changelog and features for version 1.0.0 release.',
      eta: eta3,
      priority: 'Low',
      status: 'Not Started',
      history: [{
        status: 'Not Started',
        eta: eta3,
        reason: 'Task assigned'
      }]
    });

    // Task 4: Overdue (ETA was 2 hours ago)
    const eta4 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    await Task.create({
      employeeId: emp1._id,
      title: 'Fix API connection issue',
      description: 'Investigate token verification headers and fix failing endpoint response.',
      eta: eta4,
      priority: 'High',
      status: 'Overdue',
      notified: true,
      history: [{
        status: 'Not Started',
        eta: eta4,
        reason: 'Task assigned'
      }, {
        status: 'Overdue',
        eta: eta4,
        updatedAt: eta4,
        reason: 'Automated Overdue Detection: Task ETA reached without completion.'
      }]
    });

    console.log('Database seeded successfully!');
    console.log('Manager Credentials:');
    console.log('  Email:    manager@company.com');
    console.log('  Password: Password123');

    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
