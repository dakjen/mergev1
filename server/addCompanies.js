require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCompanies() {
  try {
    const companiesToAdd = [
      { name: 'Google' },
      { name: 'Microsoft' },
      { name: 'Apple' },
      { name: 'Amazon' },
    ];

    for (const companyData of companiesToAdd) {
      await prisma.company.upsert({
        where: { name: companyData.name },
        update: {},
        create: companyData,
      });
      console.log(`Company '${companyData.name}' added or already exists.`);
    }

    console.log('Finished adding companies.');
  } catch (error) {
    console.error('Error adding companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCompanies();
