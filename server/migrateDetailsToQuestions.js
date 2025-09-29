const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateDetailsToQuestions() {
  try {
    console.log('Starting data migration from Project.details to Question model...');

    const projectsWithDetails = await prisma.project.findMany({
      where: {
        details: {
          not: null,
        },
      },
    });

    if (projectsWithDetails.length === 0) {
      console.log('No projects found with details to migrate. Exiting.');
      return;
    }

    for (const project of projectsWithDetails) {
      console.log(`Migrating project: ${project.name} (ID: ${project.id})`);
      const details = project.details;

      if (Array.isArray(details)) {
        for (const detail of details) {
          // Assuming 'detail' has 'question' and 'answer' properties
          if (detail.question && detail.answer) {
            await prisma.question.create({
              data: {
                projectId: project.id,
                text: detail.question,
                answer: detail.answer,
                status: 'completed', // Assuming migrated questions are completed
              },
            });
            console.log(`  - Created question for project ${project.id}: ${detail.question}`);
          }
        }
      }

      // After migration, set details to null to avoid reprocessing and confusion
      await prisma.project.update({
        where: { id: project.id },
        data: { details: null },
      });
      console.log(`  - Cleared details for project ${project.id}`);
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDetailsToQuestions();
