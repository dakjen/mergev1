const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   GET api/projects
// @desc    Get all projects for the logged-in user's company
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.companyName) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const projects = await prisma.project.findMany({
      where: {
        companyName: user.companyName,
      },
      include: { owner: { select: { username: true } } },
    });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.companyName) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        companyName: user.companyName,
      },
    });
    res.json(newProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private (owner only)
router.put('/:id', auth, async (req, res) => {
  const { name, description, details } = req.body;

  try {
    let project = await prisma.project.findUnique({ where: { id: req.params.id } });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to update this project' });
    }

    project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || project.name,
        details: details || project.details,
        description: description || project.description,
      },
    });
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to delete this project' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
