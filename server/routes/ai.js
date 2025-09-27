const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const fs = require('fs');
const path = require('path');

// Create a temporary file for the service account credentials
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const tempFilePath = path.join('/tmp', 'gcp-credentials.json');
fs.writeFileSync(tempFilePath, credentials);

// Configure the Vertex AI client
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
  keyFilename: tempFilePath,
};
const predictionServiceClient = new PredictionServiceClient(clientOptions);

// @route   POST api/ai/review
// @desc    Send a project for AI review
// @access  Private
router.post('/review', auth, async (req, res) => {
  const { projectId, grantWebsite, grantPurposeStatement } = req.body;

  try {
    // Fetch project details from the database
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: { select: { username: true } } },
    });

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Basic authorization
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.companyId !== project.companyId) {
      return res.status(401).json({ msg: 'User not authorized to review this project' });
    }

    // Construct the prompt
    const prompt = `You are an expert grant reviewer. Review the following project proposal in the context of a grant application.\nProject Name: ${project.name}\nProject Description: ${project.description || 'No description provided.'}\nProject Details: ${JSON.stringify(project.details || {})}\n\nGrant Website: ${grantWebsite}\nGrant Purpose Statement: ${grantPurposeStatement}\n\nPlease provide a comprehensive review of the project's suitability for the grant, considering the grant's purpose.\nHighlight the project's strengths and weaknesses in relation to the grant.\nOffer specific recommendations on what can be fixed or modified in the project proposal to better align with the grant's objectives and increase its chances of success.\nFormat your response as a markdown document with clear headings for Strengths, Weaknesses, and Recommendations.`;

    // Construct the request for the Vertex AI API
    const endpoint = `projects/gen-lang-client-0643345293/locations/us-central1/publishers/google/models/text-bison@001`;
    const instances = [{ content: prompt }];
    const parameters = {
      temperature: 0.7,
      maxOutputTokens: 512,
      topK: 40,
      topP: 0.95,
    };
    const request = {
      endpoint,
      instances,
      parameters,
    };

    // Make the API call
    const [response] = await predictionServiceClient.predict(request);
    const text = response.predictions[0].content;

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
