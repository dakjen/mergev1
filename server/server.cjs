// Force new deployment
require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET); // Add this line
const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma.cjs');

const app = express();

// Init Middleware
const corsOptions = {
  origin: [
    /https:\/\/mergev1-78hi\.vercel\.app$/,
    'http://localhost:3000'
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/narratives', require('./routes/narratives'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/files', require('./routes/files')); // New route for file operations
app.use('/api/ai', require('./routes/ai')); // New route for AI operations

module.exports = app;