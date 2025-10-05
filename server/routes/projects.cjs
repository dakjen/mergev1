const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const prisma = require('../utils/prisma.cjs');

router.get('/test-route', (req, res) => {
  res.send('Projects test route is working!');
});

// @route   GET api/projects
// @desc    Get all projects for the logged-in user's company
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const { name, status, ownerId, sortBy } = req.query;

    const whereClause = {
      companyId: user.companyId,
      isArchived: false,
    };

    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    if (status) {
      if (status === 'completed') {
        whereClause.isCompleted = true;
      } else {
        whereClause.status = status;
      }
    } else {
      whereClause.isCompleted = false;
    }

    if (ownerId) {
      whereClause.ownerId = ownerId;
    }

    let orderByClause = { createdAt: 'desc' }; // Default sort

    if (sortBy === 'oldest') {
      orderByClause = { createdAt: 'asc' };
    } else if (sortBy === 'dueDate_asc') {
      orderByClause = { deadlineDate: 'asc' };
    } else if (sortBy === 'dueDate_desc') {
      orderByClause = { deadlineDate: 'desc' };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: { select: { username: true } },
        questions: {
          select: { // Use select for scalar fields
            id: true,
            text: true,
            status: true,
            answer: true,
            maxLimit: true,
            limitUnit: true,
            createdAt: true,
            updatedAt: true,
            assignedTo: { select: { id: true, username: true, name: true } },
            assignmentLogs: true, // Include assignment logs
          },
        },
        versions: true,
      },
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects by company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET api/projects/archived
// @desc    Get all archived projects for the logged-in user's company
// @access  Private
router.get('/archived', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const projects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        isArchived: true,
      },
      include: {
        owner: { select: { username: true } },
        company: { select: { name: true } },
      },
    });
    console.log("Archived projects fetched:", projects);
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/pending-approval-count', auth, async (req, res) => {
  if (req.user.role !== 'approver') {
    return res.status(403).json({ msg: 'Authorization denied. Not an approver.' });
  }

  try {
    const pendingCount = await prisma.approvalRequest.count({
      where: {
        approverId: req.user.id,
        status: 'pending',
      },
    });
    res.json({ count: pendingCount });
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
    console.log('Pending Approvals from DB:', pendingApprovals);
    res.json(pendingApprovals);
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

router.get('/questions/assigned', auth, async (req, res) => {
  try {
    console.log('Fetching assigned questions for user ID:', req.user.id);
    const assignedQuestions = await prisma.question.findMany({
      where: {
        assignedToId: req.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            deadlineDate: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        assignmentLogs: {
          include: {
            assignedBy: { select: { id: true, username: true, name: true } },
            assignedTo: { select: { id: true, username: true, name: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Found assigned questions:', assignedQuestions.length);
    res.json(assignedQuestions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/projects/with-assigned-questions
// @desc    Get all projects that have at least one assigned question
// @access  Private
router.get('/with-assigned-questions', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const projects = await prisma.project.findMany({
      where: {
        companyId: user.companyId,
        questions: { some: {} }, // Filter for projects that have at least one question
      },
      include: {
        owner: { select: { username: true } },
        questions: {
          include: {
            assignedTo: { select: { id: true, username: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects/upload-document
// @desc    Upload a document, parse questions/answers, and create a project
// @access  Private
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // files will be stored in memory
const pdf = require('pdf-parse'); // Import pdf-parse
router.post('/upload-document', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    let extractedText = '';
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

    if (fileExtension === 'pdf') {
      const dataBuffer = req.file.buffer; // Read from buffer
      const data = await pdf(dataBuffer);
      extractedText = data.text;
    } else if (fileExtension === 'txt') {
      extractedText = req.file.buffer.toString('utf8'); // Read from buffer
    } else {
      // Handle other file types or return an error
      return res.status(400).json({ msg: `Unsupported file type: ${fileExtension}` });
    }

    // --- Basic Q&A Extraction Logic ---
    const questionsAndAnswers = [];
    const sentences = extractedText.split(/(?<=[.?!])\s+/); // Split by sentence-ending punctuation

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      // Basic check for questions
      if (sentence.endsWith('?') || /^(who|what|where|when|why|how)\b/i.test(sentence)) {
        let answer = '';
        // Try to find an answer in the next sentence(s)
        if (i + 1 < sentences.length) {
          answer = sentences[i + 1].trim();
          // You might want more sophisticated logic here to combine multiple sentences for an answer
        }
        questionsAndAnswers.push({ text: sentence, answer: answer });
        i++; // Skip the next sentence if it was used as an answer
      }
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const projectName = `Parsed Project from ${req.file.originalname}`;
    const projectDescription = extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''); // Use first 500 chars as description

    const newProject = await prisma.project.create({
      data: {
        name: projectName,
        description: projectDescription,
        ownerId: req.user.id,
        companyId: user.companyId,
        isCompleted: true, // Mark as completed for past projects
        questions: {
          create: questionsAndAnswers.length > 0 ? questionsAndAnswers.map(qa => ({
            text: qa.text,
            // For now, we're storing the answer in the question's description or a separate field if available
            // Since our Question model only has 'text', we'll append answer to text for now or ignore.
            // For this iteration, we'll just create questions.
            status: 'pending', // Default status for newly parsed questions
          })) : [{ text: 'No specific questions found. Document parsed.', status: 'completed' }],
        },
      },
      include: {
        questions: true,
      },
    });

    // No need to clean up file as it was stored in memory

// @route   POST api/projects/parse-pasted-text
// @desc    Parse pasted text and create a new completed project
// @access  Private
router.post('/parse-pasted-text', auth, async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ msg: 'No content provided' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { company: true } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const lines = content.split('\n');
    const name = lines[0];
    const description = lines.slice(1).join('\n');

    // --- Basic Q&A Extraction Logic ---
    const questionsAndAnswers = [];
    const sentences = content.split(/(?<=[.?!])\s+/); // Split by sentence-ending punctuation

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      // Basic check for questions
      if (sentence.endsWith('?') || /^(who|what|where|when|why|how)\b/i.test(sentence)) {
        let answer = '';
        // Try to find an answer in the next sentence(s)
        if (i + 1 < sentences.length) {
          answer = sentences[i + 1].trim();
          // You might want more sophisticated logic here to combine multiple sentences for an answer
        }
        questionsAndAnswers.push({ text: sentence, answer: answer });
        i++; // Skip the next sentence if it was used as an answer
      }
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        companyId: user.companyId,
        isCompleted: true,
        status: 'completed',
        questions: {
          create: questionsAndAnswers.length > 0 ? questionsAndAnswers.map(qa => ({
            text: qa.text,
            answer: qa.answer,
            status: 'pending',
          })) : [],
        },
      },
      include: {
        owner: { select: { username: true } },
        company: { select: { name: true } },
        questions: true,
      }
    });

    res.json({ msg: 'Project created successfully', project: newProject });
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
      include: {
        owner: { select: { username: true } },
        questions: {
          include: {
            assignedTo: { select: { id: true, username: true, name: true } },
            assignmentLogs: {
              include: {
                assignedBy: { select: { id: true, username: true, name: true } },
                assignedTo: { select: { id: true, username: true, name: true } },
              },
            },
          },
        },
        narrative: true,
      },
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    res.json(project);
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

    if (project.ownerId !== req.user.id && user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to delete this project' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
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

// @route   GET api/projects/:projectId/summary
// @desc    Get summary of questions for a project (total, completed, user completion status)
// @access  Private
router.get('/:projectId/summary', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true, company: true }
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Ensure user belongs to the same company as the project
    if (req.user.companyId !== project.companyId) {
      return res.status(401).json({ msg: 'Not authorized to view this project summary' });
    }

    const questions = await prisma.question.findMany({
      where: { projectId },
      include: {
        assignedTo: {
          select: { id: true, username: true, name: true }
        }
      }
    });

    const totalQuestions = questions.length;
    const completedQuestions = questions.filter(q => q.status === 'completed' || q.status === 'submitted').length;

    const userCompletion = {};
    const allAssignees = new Set();

    questions.forEach(q => {
      if (q.assignedTo) {
        const userId = q.assignedTo.id;
        const username = q.assignedTo.username;
        allAssignees.add(userId);

        if (!userCompletion[userId]) {
          userCompletion[userId] = {
            id: userId,
            username: username,
            totalAssigned: 0,
            completed: 0,
            pending: 0,
            submitted: 0,
            notCompleted: 0 // Questions not yet completed or submitted
          };
        }
        userCompletion[userId].totalAssigned++;
        if (q.status === 'completed') {
          userCompletion[userId].completed++;
        } else if (q.status === 'submitted') {
          userCompletion[userId].submitted++;
        } else {
          userCompletion[userId].pending++;
        }
      }
    });

    // Calculate notCompleted for each user
    Object.values(userCompletion).forEach(user => {
      user.notCompleted = user.totalAssigned - (user.completed + user.submitted);
    });

    // Get all users in the company to identify those who haven't been assigned any questions
    const companyUsers = await prisma.user.findMany({
      where: { companyId: project.companyId },
      select: { id: true, username: true, name: true }
    });

    const usersNotAssigned = companyUsers.filter(u => !allAssignees.has(u.id));

    // Identify users who have assigned questions but haven't completed all of them
    const usersWithIncompleteQuestions = Object.values(userCompletion).filter(user => user.notCompleted > 0);

    res.json({
      totalQuestions,
      completedQuestions,
      userCompletion: Object.values(userCompletion),
      usersNotAssigned,
      usersWithIncompleteQuestions
    });

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
    console.log('Pending Approvals from DB:', pendingApprovals);
    res.json(pendingApprovals);
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
        status: approvalStatus, // Set status to 'approved' or 'rejected'
      },
    });

    res.json({ msg: `Project ${approvalStatus} successfully` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/pending-approval-count
// @desc    Get count of pending approval requests for the current approver
// @access  Private (approver only)
router.put('/questions/:id/assign', auth, async (req, res) => {
  const { assignedToId, status, answer, text } = req.body; // Add text

  try {
    let question = await prisma.question.findUnique({ where: { id: req.params.id } });

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    // Authorization: Only project owner or admin can assign/update questions
    // Or the assigned user can update their own answer/status
    const project = await prisma.project.findUnique({ where: { id: question.projectId } });
    const isAuthorizedToAssign = (project.ownerId === req.user.id || req.user.role === 'admin');
    const isAssignedUser = (question.assignedToId === req.user.id);

    if (!isAuthorizedToAssign && !isAssignedUser) {
      return res.status(401).json({ msg: 'User not authorized to update this question' });
    }

    // Log assignment change if assignedToId is different and user is authorized to assign
    if (assignedToId && assignedToId !== question.assignedToId && isAuthorizedToAssign) {
      await prisma.questionAssignmentLog.create({
        data: {
          questionId: question.id,
          assignedById: req.user.id, // User who performed the re-assignment
          assignedToId: assignedToId,
        },
      });
    }

    question = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        assignedToId: assignedToId || question.assignedToId,
        status: status || question.status,
        answer: answer || question.answer, // Update answer
        text: text || question.text, // Update text
      },
    });
    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects/:id/questions
// @desc    Create a new question for an existing project
// @access  Private (project owner or admin only)
router.post('/questions/:projectId/questions', auth, async (req, res) => {
  const { text, assignedToId, status } = req.body;

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Authorization: Only project owner or admin can add questions
    if (project.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to add questions to this project' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        projectId: req.params.projectId,
        text,
        assignedToId: assignedToId || null,
        status: status || 'pending',
      },
    });
    res.json(newQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/projects/:projectId/questions/assigned-to-me
// @desc    Get questions assigned to the logged-in user for a specific project
// @access  Private
router.get('/:projectId/questions/assigned-to-me', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project exists and user has access (optional, but good practice)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true, company: true }
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Ensure user belongs to the same company as the project
    if (req.user.companyId !== project.companyId) {
      return res.status(401).json({ msg: 'Not authorized to view questions for this project' });
    }

    const assignedQuestions = await prisma.question.findMany({
      where: {
        projectId: projectId,
        assignedToId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            deadlineDate: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        assignmentLogs: {
          include: {
            assignedBy: { select: { id: true, username: true, name: true } },
            assignedTo: { select: { id: true, username: true, name: true } },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(assignedQuestions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route   PUT api/projects/:id/archive
// @desc    Archive a project
// @access  Private (owner or admin)
router.put('/:id/archive', auth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || (project.ownerId !== req.user.id && user.role !== 'admin')) {
      return res.status(401).json({ msg: 'User not authorized to archive this project' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: { isArchived: true },
    });

    res.json(updatedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/projects/questions/:id
// @desc    Delete a question
// @access  Private (admin only)
router.delete('/questions/:id', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to delete questions' });
    }

    const question = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ msg: 'Question removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/questions/:questionId
// @desc    Update a question's answer and status
// @access  Private (Assigned user or Admin)
router.put('/questions/:questionId', auth, async (req, res) => {
  const { questionId } = req.params;
  const { answer, status } = req.body;

  try {
    let question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }

    // Authorization: Only the assigned user or an admin can update the question
    if (req.user.role !== 'admin' && req.user.id !== question.assignedToId) {
      return res.status(401).json({ msg: 'Not authorized to update this question' });
    }

    const updatedData = {};
    if (answer !== undefined) {
      updatedData.answer = answer;
    }
    if (status !== undefined) {
      updatedData.status = status;
    }

    question = await prisma.question.update({
      where: { id: questionId },
      data: updatedData,
    });

    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects/:id/compile
// @desc    Compile a project's questions and answers into a narrative
// @access  Private
router.post('/:id/compile', auth, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Optional: Add authorization to ensure only project owner or admin can compile
    if (project.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized to compile this project' });
    }

    const narrativeContent = project.questions
      .map(q => `Q: ${q.text}\nA: ${q.answer || 'No answer provided'}`)
      .join('\n\n');

    const narrative = await prisma.narrative.create({
      data: {
        title: `${project.name} - Narrative`,
        content: narrativeContent,
        authorId: req.user.id,
        projectId: project.id,
      },
    });

    res.json(narrative);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id/rescind-approval
// @desc    Rescind a project's approval request (admin only)
// @access  Private (admin only)
router.put('/:id/rescind-approval', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Authorization denied. Only admins can rescind approval requests.' });
  }

  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { approvalRequests: { where: { status: 'pending' } } },
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found.' });
    }

    if (project.status !== 'pending_approval') {
      return res.status(400).json({ msg: 'Project is not in pending approval status.' });
    }

    // Update project status back to draft
    await prisma.project.update({
      where: { id },
      data: { status: 'draft' },
    });

    // Update all pending approval requests for this project to 'rescinded'
    await prisma.approvalRequest.updateMany({
      where: { projectId: id, status: 'pending' },
      data: { status: 'rescinded', respondedAt: new Date() },
    });

    res.json({ msg: 'Project approval request rescinded successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
