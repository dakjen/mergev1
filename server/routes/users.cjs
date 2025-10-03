
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../utils/prisma.cjs');

// @route   GET api/users
// @desc    Get all users for the logged-in user's company
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
      },
      select: { id: true, username: true, email: true, role: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
