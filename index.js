const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'render_node_test';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Add your MongoDB connection string to the environment.');
}

const mongoClient = new MongoClient(MONGODB_URI);
let users;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;

  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, database: users ? 'connected' : 'connecting' });
});

app.post('/api/signup', async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  try {
    await users.insertOne({
      username,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date()
    });

    return res.json({ success: true, message: 'Account created successfully! You can now log in.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists.' });
    }

    console.error('Signup failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to create account.' });
  }
});

app.post('/api/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  try {
    const user = await users.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.json({ success: true, message: `Welcome back, ${user.username}!` });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to log in.' });
  }
});

async function start() {
  await mongoClient.connect();
  const database = mongoClient.db(DB_NAME);
  users = database.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Unable to connect to MongoDB:', error);
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing MongoDB connection.`);
  await mongoClient.close();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
