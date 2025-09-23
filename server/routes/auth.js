const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth'); // Import auth middleware

// Register User
router.post('/register', async (req, res) => {
  const { username, password, name, birthdate, email, companyId } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Check if email already exists
    let existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        birthdate,
        email,
        company: companyId ? { connect: { id: companyId } } : undefined, // Connect to company if companyId is provided
      },
      include: { company: true } // Include company to get its name for JWT
    });

    const payload = {
      user: {
        id: newUser.id,
        role: newUser.role,
        username: newUser.username,
        companyId: newUser.companyId,
        companyName: newUser.company ? newUser.company.name : null
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { username, password, companyId } = req.body;

  try {
    let user = await prisma.user.findUnique({
      where: { username },
      include: { company: true } // Include company relation
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ msg: 'Account awaiting admin approval' });
    }

    // Check if provided companyId matches user's assigned companyId
    if (companyId) { // If a companyId is provided in the request
      if (!user.companyId) { // If the user is NOT associated with a company
        return res.status(400).json({ msg: 'User not associated with a company. Please contact admin.' });
      } else if (user.companyId !== companyId) { // If user IS associated, but provided companyId doesn't match
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        companyId: user.companyId,
        companyName: user.company ? user.company.name : null // Include company name if available
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Change Password
router.put('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  // Basic validation
  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ msg: 'New passwords do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ msg: 'New password must be at least 6 characters' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect old password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;