// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/compliance_scheduler', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema (email-based)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  assignedTo: [{
    type: String // email addresses
  }],
  notificationSent: {
    type: Boolean,
    default: false
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

// Email Configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
    }
  });
};

// Email Service Functions
const sendTaskNotification = async (task, recipientEmail, type = 'created') => {
  try {
    const transporter = createTransporter();
    
    let subject, html;
    
    switch(type) {
      case 'created':
        subject = `New Compliance Task: ${task.title}`;
        html = `
          <h2>New Compliance Task Assigned</h2>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Description:</strong> ${task.description}</p>
          <p><strong>Priority:</strong> ${task.priority.toUpperCase()}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Category:</strong> ${task.category}</p>
        `;
        break;
      case 'reminder':
        subject = `Reminder: ${task.title} - Due Soon`;
        html = `
          <h2>Task Reminder</h2>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${task.priority.toUpperCase()}</p>
          <p>This task is due soon. Please ensure completion on time.</p>
        `;
        break;
      case 'overdue':
        subject = `OVERDUE: ${task.title}`;
        html = `
          <h2>Overdue Task Alert</h2>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${task.priority.toUpperCase()}</p>
          <p style="color: red;"><strong>This task is overdue and requires immediate attention.</strong></p>
        `;
        break;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: subject,
      html: html
    });

    console.log(`Email sent to ${recipientEmail} for task: ${task.title}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Routes

// Auth - Email validation/registration
app.post('/api/auth/validate-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({ email });
      await user.save();
    }

    res.json({ 
      success: true, 
      user: { email: user.email, createdAt: user.createdAt } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user tasks
app.get('/api/tasks/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const tasks = await Task.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    taskData.updatedAt = new Date();
    
    const task = new Task(taskData);
    await task.save();

    // Send immediate notification to creator
    await sendTaskNotification(task, task.userEmail, 'created');

    // Send notifications to assigned users
    if (task.assignedTo && task.assignedTo.length > 0) {
      for (const assignee of task.assignedTo) {
        if (assignee !== task.userEmail) {
          await sendTaskNotification(task, assignee, 'created');
        }
      }
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };
    
    const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/dashboard/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const now = new Date();
    
    const totalTasks = await Task.countDocuments({ userEmail: email });
    const completedTasks = await Task.countDocuments({ userEmail: email, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ userEmail: email, status: 'pending' });
    const overdueTasks = await Task.countDocuments({ 
      userEmail: email, 
      dueDate: { $lt: now },
      status: { $ne: 'completed' }
    });

    const upcomingTasks = await Task.find({
      userEmail: email,
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      status: { $ne: 'completed' }
    }).sort({ dueDate: 1 }).limit(5);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      upcomingTasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled job for reminders and overdue notifications
cron.schedule('0 9 * * *', async () => { // Run daily at 9 AM
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Send reminders for tasks due tomorrow
    const reminderTasks = await Task.find({
      dueDate: { $gte: now, $lt: tomorrow },
      status: { $ne: 'completed' },
      reminderSent: false
    });

    for (const task of reminderTasks) {
      await sendTaskNotification(task, task.userEmail, 'reminder');
      
      // Send to assigned users
      if (task.assignedTo && task.assignedTo.length > 0) {
        for (const assignee of task.assignedTo) {
          await sendTaskNotification(task, assignee, 'reminder');
        }
      }
      
      task.reminderSent = true;
      await task.save();
    }

    // Update overdue tasks and send notifications
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: 'completed' }
    });

    for (const task of overdueTasks) {
      if (task.status !== 'overdue') {
        task.status = 'overdue';
        await task.save();
        
        await sendTaskNotification(task, task.userEmail, 'overdue');
        
        if (task.assignedTo && task.assignedTo.length > 0) {
          for (const assignee of task.assignedTo) {
            await sendTaskNotification(task, assignee, 'overdue');
          }
        }
      }
    }

    console.log(`Processed ${reminderTasks.length} reminders and ${overdueTasks.length} overdue tasks`);
  } catch (error) {
    console.error('Error in scheduled job:', error);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Compliance Scheduler Backend running on port ${PORT}`);
});

module.exports = app;