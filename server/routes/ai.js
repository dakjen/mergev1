const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import Google Generative AI SDK

// Access your API key as an environment variable (ensure GEMINI_API_KEY is set in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



// @route   POST api/ai/review
// @desc    Send a project for AI review
// @access  Private
router.post('/review', auth, async (req, res) => {
  const { projectId, grantWebsite, grantPurposeStatement } = req.body; // Updated to receive new parameters

  try {
    // Ensure GEMINI_API_KEY is set
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ msg: 'Google Gemini API Key not configured on server.' });
    }

    // Fetch project details from the database
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: { select: { username: true } } }, // Include owner for context
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Basic authorization: ensure user is associated with the project's company
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.companyId !== project.companyId) {
      return res.status(401).json({ msg: 'User not authorized to review this project' });
    }

    // Construct the prompt for the Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5' });

    const prompt = `You are an expert grant reviewer. Review the following project proposal in the context of a grant application.\nProject Name: ${project.name}\nProject Description: ${project.description || 'No description provided.'}\nProject Details: ${JSON.stringify(project.details || {})}\n\nGrant Website: ${grantWebsite}\nGrant Purpose Statement: ${grantPurposeStatement}\n\nPlease provide a comprehensive review of the project's suitability for the grant, considering the grant's purpose.\nHighlight the project's strengths and weaknesses in relation to the grant.\nOffer specific recommendations on what can be fixed or modified in the project proposal to better align with the grant's objectives and increase its chances of success.\nFormat your response as a markdown document with clear headings for Strengths, Weaknesses, and Recommendations.`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text() || 'No response from AI';

    // Save the AI review to the database
    await prisma.aIReviewLog.create({
      data: {
        projectId: project.id,
        reviewedById: req.user.id,
        aiResponse: text,
        grantWebsite: grantWebsite,
        grantPurposeStatement: grantPurposeStatement,
      },
    });

    res.json({ review: text });
  } catch (err) {
    console.error('AI Review Error:', err);
    res.status(500).json({ msg: err.message || 'Server Error during AI review.' });
  }
});

// @route   GET api/ai/reviews
// @desc    Get all AI review logs for the logged-in user's company
// @access  Private
router.get('/reviews', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.companyId) {
      return res.status(400).json({ msg: 'User not associated with a company' });
    }

    const reviews = await prisma.aIReviewLog.findMany({
      where: {
        project: { // Filter by project's companyId
          companyId: user.companyId,
        },
      },
      include: {
        project: {
          select: { name: true },
        },
        reviewedBy: {
          select: { username: true },
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
    });

    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;