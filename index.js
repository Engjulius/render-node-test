const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Temporary in-memory user storage (Will reset on Render container restart)
const users = [];

// Signup Endpoint
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists.' });
  }

  users.push({ username, email, password });
  return res.json({ success: true, message: 'Account created successfully! You can now log in.' });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  return res.json({ success: true, message: `Welcome back, ${user.username}!` });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

