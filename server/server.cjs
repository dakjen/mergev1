// Force new deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma.cjs');

const app = express();

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Init Middleware
const corsOptions = {
  origin: '*', // Allow all origins for testing
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  console.log('Request URL:', req.url);
  res.send('Server is running');
});

// Define Routes
app.use('/api/auth', require('./routes/auth.cjs'));
app.use('/api/narratives', require('./routes/narratives.cjs'));
app.use('/api/admin', require('./routes/admin.cjs'));
app.use('/api/companies', require('./routes/companies.cjs'));
app.use('/api/projects', require('./routes/projects.cjs'));
app.use('/api/files', require('./routes/files.cjs')); // New route for file operations
app.use('/api/ai', require('./routes/ai.cjs')); // New route for AI operations
app.use('/api/users', require('./routes/users.cjs'));

app.get('/api/test', (req, res) => {
  res.send('Test route is working!');
});

module.exports = app;