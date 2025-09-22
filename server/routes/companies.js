const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/companies
// @desc    Get all companies
// @access  Public
router.get('/', async (req, res) => {
  console.log('GET /api/companies route hit!'); // Debugging log
  try {
    const companies = await prisma.company.findMany();
    res.json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/companies
// @desc    Create a new company
// @access  Private (admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }
  const { name } = req.body;
  try {
    const newCompany = await prisma.company.create({
      data: { name }
    });
    res.json(newCompany);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/companies/:id
// @desc    Update a company
// @access  Private (admin only)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }
  const { name } = req.body;
  try {
    const updatedCompany = await prisma.company.update({
      where: { id: req.params.id },
      data: { name }
    });
    res.json(updatedCompany);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/companies/:id
// @desc    Delete a company
// @access  Private (admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }
  try {
    await prisma.company.delete({
      where: { id: req.params.id }
    });
    res.json({ msg: 'Company removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
