const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../server.cjs');

// @route   GET api/projects
// @desc    Get all projects for the logged-in user's company
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const projects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
      },
      include: {
        owner: { select: { username: true } },
        company: { select: { name: true } },
      }
    });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/:id
// @desc    Get a single project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { username: true } }, company: true },
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.companyId !== project.companyId) {
      return res.status(401).json({ msg: 'User not authorized to view this project' });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, description, deadlineDate } = req.body; // Add deadlineDate

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null, // Save deadlineDate
        ownerId: req.user.id,
        companyId: user.companyId,
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
  const { name, description, details, isCompleted } = req.body; // Add isCompleted

  try {
    let project = await prisma.project.findUnique({ where: { id: req.params.id }, include: { company: true } });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to update this project' });
    }

    // Create a snapshot before updating
    const latestVersion = await prisma.projectVersion.findMany({
      where: { projectId: project.id },
      orderBy: { versionNumber: 'desc' },
      take: 1,
    });

    const newVersionNumber = latestVersion.length > 0 ? latestVersion[0].versionNumber + 1 : 1;

    await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        versionNumber: newVersionNumber,
        snapshot: { ...project, companyName: project.company?.name || null }, // Store the current project state as a snapshot, including companyName for display
        createdById: req.user.id,
      },
    });

    project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || project.name,
        details: details || project.details,
        description: description || project.description,
        isCompleted: typeof isCompleted === 'boolean' ? isCompleted : project.isCompleted, // Update isCompleted
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
    const project = await prisma.project.findUnique({ where: { id: req.params.id }, include: { company: true } });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.companyId !== project.companyId) {
      return res.status(401).json({ msg: 'User not authorized to delete this project' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/:id/versions
// @desc    Get all versions for a project
// @access  Private
router.get('/:id/versions', auth, async (req, res) => {
  try {
    const projectVersions = await prisma.projectVersion.findMany({
      where: { projectId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { username: true } } },
    });
    res.json(projectVersions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/deadlines
// @desc    Get all project deadlines for the logged-in user's company
// @access  Private
router.get('/deadlines', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const deadlines = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        deadlineDate: {
          not: null, // Only projects with a deadline date
        },
      },
      select: {
        id: true,
        name: true,
        deadlineDate: true,
      },
      orderBy: {
        deadlineDate: 'asc', // Order by deadline date
      },
    });

    // Format the deadlines for the client
    const formattedDeadlines = deadlines.map(project => ({
      id: project.id,
      name: project.name,
      projectName: project.name, // Use project name as deadline name for now
      deadlineDate: project.deadlineDate,
    }));

    res.json(formattedDeadlines);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/completed
// @desc    Get all completed projects for the logged-in user's company
// @access  Private
router.get('/completed', auth, async (req, res) => {
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
      include: { owner: { select: { username: true } } },
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

// @route   POST api/projects/:id/request-approval
// @desc    Request approval for a project
// @access  Private
router.post('/:id/request-approval', auth, async (req, res) => {
  const { approverId } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Ensure the requesting user is the project owner
    if (project.ownerId !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to request approval for this project' });
    }

    // Ensure the approver exists and is in the same company
    const approver = await prisma.user.findUnique({ where: { id: approverId } });
    if (!approver || approver.companyId !== project.companyId || approver.role !== 'approver') {
      return res.status(400).json({ msg: 'Invalid approver selected' });
    }

    // Update project status
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'pending_approval' },
    });

    // Create approval request log
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        projectId: req.params.id,
        requestedById: req.user.id,
        approverId: approverId,
        status: 'pending',
      },
    });

    res.json({ msg: 'Approval request sent', approvalRequest });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/pending-approval
// @desc    Get projects pending approval for the current approver
// @access  Private (approver only)
router.get('/pending-approval', auth, async (req, res) => {
  if (req.user.role !== 'approver') {
    return res.status(403).json({ msg: 'Authorization denied. Not an approver.' });
  }

  try {
    const pendingApprovals = await prisma.approvalRequest.findMany({
      where: {
        approverId: req.user.id,
        status: 'pending',
      },
      include: {
        project: {
          include: { owner: { select: { username: true } } },
        },
        requestedBy: { select: { username: true } },
      },
      orderBy: {
        requestedAt: 'asc',
      },
    });

    res.json(pendingApprovals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id/respond-approval
// @desc    Approve or reject a project
// @access  Private (approver only)
router.put('/:id/respond-approval', auth, async (req, res) => {
  if (req.user.role !== 'approver') {
    return res.status(403).json({ msg: 'Authorization denied. Not an approver.' });
  }

  const { approvalStatus, comments } = req.body; // approvalStatus: 'approved' or 'rejected'

  try {
    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: {
        projectId: req.params.id,
        approverId: req.user.id,
        status: 'pending',
      },
    });

    if (!approvalRequest) {
      return res.status(404).json({ msg: 'Pending approval request not found for this project and approver.' });
    }

    // Update the approval request
    await prisma.approvalRequest.update({
      where: { id: approvalRequest.id },
      data: {
        status: approvalStatus,
        comments: comments || null,
        respondedAt: new Date(),
      },
    });

    // Update project status based on approval response
    await prisma.project.update({
      where: { id: req.params.id },
      data: {
        status: approvalStatus === 'approved' ? 'approved' : 'draft', // If rejected, revert to draft
      },
    });

    res.json({ msg: `Project ${approvalStatus} successfully` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/rejected
// @desc    Get all rejected projects for the logged-in user's company
// @access  Private
router.get('/rejected', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const rejectedProjects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        status: 'rejected', // Filter for rejected projects
      },
      include: {
        owner: { select: { username: true } },
        company: { select: { name: true } },
        approvalRequests: {
          where: { status: 'rejected' },
          orderBy: { respondedAt: 'desc' },
          take: 1, // Get the latest rejection comments
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(rejectedProjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;