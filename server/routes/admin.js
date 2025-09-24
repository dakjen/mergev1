const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   PUT api/admin/users/:id/approve
// @desc    Approve a user account
// @access  Private (admin only)
router.put('/users/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  const { role, companyId } = req.body;
  const updateData = { isApproved: true };
  if (role && ['viewer', 'editor', 'admin', 'approver'].includes(role)) {
    updateData.role = role;
  }
  if (companyId) {
    updateData.companyId = companyId;
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create an entry in ApprovedLog
    await prisma.approvedLog.create({
      data: {
        approvedUserId: user.id,
        approvedByUserId: req.user.id,
        roleAssigned: user.role,
        companyAssignedId: user.companyId || null,
      },
    });

    res.json({ msg: 'User approved', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users/pending
// @desc    Get all pending user accounts
// @access  Private (admin only)
router.get('/users/pending', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  try {
    const pendingUsers = await prisma.user.findMany({
      where: { isApproved: false },
      select: { id: true, username: true, email: true, role: true, isApproved: true, createdAt: true, company: { select: { id: true, name: true } } }
    });
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/users
// @desc    Get all user accounts
// @access  Private (admin only)
router.get('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true, isApproved: true, createdAt: true, company: { select: { id: true, name: true } } }
    });
    res.json(allUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/users/:id/update
// @desc    Update an existing user's role and company
// @access  Private (admin only)
router.put('/users/:id/update', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  const { role, companyId } = req.body;
  const updateData = {};

  if (role && ['viewer', 'editor', 'admin', 'approver'].includes(role)) {
    updateData.role = role;
  }
  if (companyId) {
    updateData.companyId = companyId;
  } else if (companyId === null) { // Allow setting companyId to null
    updateData.companyId = null;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ msg: 'No valid fields to update provided.' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, username: true, email: true, role: true, isApproved: true, createdAt: true, company: { select: { id: true, name: true } } }
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User updated', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/approvals/history
// @desc    Get all approval log entries
// @access  Private (admin only)
router.get('/approvals/history', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  try {
    const approvalHistory = await prisma.approvedLog.findMany({
      include: {
        approvedUser: { select: { username: true, email: true } },
        approvedBy: { select: { username: true, email: true } },
        companyAssigned: { select: { name: true } },
      },
      orderBy: { approvedAt: 'desc' },
    });
    res.json(approvalHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/users
// @desc    Create a new user
// @access  Private (admin only)
router.post('/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  const { username, email, password, role, companyId } = req.body;

  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ msg: 'User with that email already exists' });
    }

    user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      return res.status(400).json({ msg: 'User with that username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || 'viewer', // Default to viewer if not provided
        companyId: companyId || null, // Assign company if provided
        isApproved: true, // Manually added users are approved by default
      },
      select: { id: true, username: true, email: true, role: true, isApproved: true, createdAt: true, company: { select: { id: true, name: true } } }
    });

    res.json({ msg: 'User created successfully', user: newUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
