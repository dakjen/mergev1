const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   PUT api/admin/users/:id/approve
// @desc    Approve a user account
// @access  Private (admin only)
router.put('/users/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Not an admin.' });
  }

  const { role } = req.body;
  const updateData = { isApproved: true };
  if (role && ['viewer', 'editor', 'admin'].includes(role)) {
    updateData.role = role;
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

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
      select: { id: true, username: true, role: true, createdAt: true }
    });
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
