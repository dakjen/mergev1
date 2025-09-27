// Force new deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma.cjs');

const app = express();

// Init Middleware
const whitelist = ['http://localhost:3000', 'https://mergev1-78hi.vercel.app'];
const corsOptions = {
  origin: function (origin, callback) {
    console.log('Request origin:', origin); // Log the origin
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/narratives', require('./routes/narratives'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/files', require('./routes/files')); // New route for file operations
app.use('/api/ai', require('./routes/ai')); // New route for AI operations
app.use('/api/users', require('./routes/users'));

module.exports = app;