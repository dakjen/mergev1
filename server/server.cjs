// Force new deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma.cjs');

const app = express();

// Init Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://mergev1-78hi.vercel.app', // Production URL
      // Add other specific allowed origins if needed, e.g., local development
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow if origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    }
    // Allow Vercel preview deployments
    else if (process.env.VERCEL_ENV === 'preview' && origin.endsWith('.vercel.app')) {
      callback(null, true);
    }
    else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
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

// @route   GET api/projects/completed
// @desc    Get all completed projects for the logged-in user's company
// @access  Private
app.get('/api/projects/completed', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const completedProjects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        isCompleted: true, // Filter for completed projects
      },
      include: { owner: { select: { username: true } }, company: { select: { name: true } } },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(completedProjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/test', (req, res) => {
  res.send('Test route is working!');
});

module.exports = app;