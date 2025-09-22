require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

// Test database connection
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

connectDB();

// Init Middleware
app.use(cors({
  origin: '*'
}));
app.use(express.json());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/narratives', require('./routes/narratives'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/projects', require('./routes/projects'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));