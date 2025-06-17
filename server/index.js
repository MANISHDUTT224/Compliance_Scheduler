const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./comply.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    heading TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date DATETIME NOT NULL,
    people_involved TEXT,
    reminders TEXT,
    notes TEXT,
    files TEXT,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  // Email logs table
  db.run(`CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,
    recipient_email TEXT,
    email_type TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id)
  )`);
});

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Email sending function
const sendTaskEmail = async (taskData, recipients, emailType) => {
  try {
    const subject = emailType === 'creation' 
      ? `New Task Assigned: ${taskData.heading}`
      : `Task Reminder: ${taskData.heading}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${subject}</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${taskData.heading}</h3>
          <p><strong>Description:</strong> ${taskData.description}</p>
          <p><strong>Due Date:</strong> ${new Date(taskData.due_date).toLocaleDateString()}</p>
          <p><strong>Priority:</strong> ${taskData.priority}</p>
          <p><strong>Category:</strong> ${taskData.category}</p>
          ${taskData.notes ? `<p><strong>Notes:</strong> ${taskData.notes}</p>` : ''}
        </div>
        <p style="color: #64748b;">This is an automated message from Comply Smart Compliance Scheduler.</p>
      </div>
    `;

    for (const email of recipients) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        html
      });

      // Log email
      db.run(
        'INSERT INTO email_logs (task_id, recipient_email, email_type) VALUES (?, ?, ?)',
        [taskData.id, email, emailType]
      );
    }

    console.log(`${emailType} emails sent for task: ${taskData.heading}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Routes

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        
        const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, email, name } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Task routes
app.get('/api/tasks', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM tasks WHERE created_by = ? ORDER BY due_date ASC',
    [req.user.userId],
    (err, tasks) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const formattedTasks = tasks.map(task => ({
        ...task,
        peopleInvolved: JSON.parse(task.people_involved || '[]'),
        reminders: JSON.parse(task.reminders || '[]'),
        files: JSON.parse(task.files || '[]'),
        dueDate: task.due_date,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        createdBy: task.created_by
      }));
      
      res.json(formattedTasks);
    }
  );
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const {
      id,
      heading,
      description,
      dueDate,
      peopleInvolved,
      reminders,
      notes,
      files,
      status,
      priority,
      category
    } = req.body;

    const taskData = {
      id: id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      heading,
      description,
      due_date: dueDate,
      people_involved: JSON.stringify(peopleInvolved || []),
      reminders: JSON.stringify(reminders || []),
      notes: notes || '',
      files: JSON.stringify(files || []),
      status,
      priority,
      category,
      created_by: req.user.userId
    };

    db.run(
      `INSERT INTO tasks (
        id, heading, description, due_date, people_involved, reminders, 
        notes, files, status, priority, category, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskData.id, taskData.heading, taskData.description, taskData.due_date,
        taskData.people_involved, taskData.reminders, taskData.notes,
        taskData.files, taskData.status, taskData.priority, taskData.category,
        taskData.created_by
      ],
      async function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Send creation emails
        if (peopleInvolved && peopleInvolved.length > 0) {
          await sendTaskEmail(taskData, peopleInvolved, 'creation');
        }

        res.json({ 
          id: taskData.id,
          message: 'Task created successfully',
          emailsSent: peopleInvolved ? peopleInvolved.length : 0
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    heading,
    description,
    dueDate,
    peopleInvolved,
    reminders,
    notes,
    files,
    status,
    priority,
    category
  } = req.body;

  db.run(
    `UPDATE tasks SET 
      heading = ?, description = ?, due_date = ?, people_involved = ?,
      reminders = ?, notes = ?, files = ?, status = ?, priority = ?,
      category = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND created_by = ?`,
    [
      heading, description, dueDate, JSON.stringify(peopleInvolved || []),
      JSON.stringify(reminders || []), notes || '', JSON.stringify(files || []),
      status, priority, category, id, req.user.userId
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ message: 'Task updated successfully' });
    }
  );
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM tasks WHERE id = ? AND created_by = ?',
    [id, req.user.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ message: 'Task deleted successfully' });
    }
  );
});

// Cron job for reminder emails
cron.schedule('0 9 * * *', () => {
  console.log('Running daily reminder check...');
  
  const today = new Date();
  
  db.all(
    `SELECT t.*, u.email as user_email FROM tasks t 
     JOIN users u ON t.created_by = u.id 
     WHERE t.status != 'complete'`,
    [],
    async (err, tasks) => {
      if (err) {
        console.error('Error fetching tasks for reminders:', err);
        return;
      }
      
      for (const task of tasks) {
        const dueDate = new Date(task.due_date);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        const reminders = JSON.parse(task.reminders || '[]');
        const peopleInvolved = JSON.parse(task.people_involved || '[]');
        
        for (const reminder of reminders) {
          if (daysDiff === reminder.timing && !reminder.sent) {
            await sendTaskEmail(task, peopleInvolved, 'reminder');
            
            // Mark reminder as sent
            const updatedReminders = reminders.map(r => 
              r.timing === reminder.timing ? { ...r, sent: true } : r
            );
            
            db.run(
              'UPDATE tasks SET reminders = ? WHERE id = ?',
              [JSON.stringify(updatedReminders), task.id]
            );
          }
        }
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});