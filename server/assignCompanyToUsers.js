const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignCompanyToAllUsers() {
  const companyId = 'cmfvd8ay10000dqugpqn77z1e'; // NREUV companyId

  try {
    const updatedUsers = await prisma.user.updateMany({
      where: { companyId: null }, // Only update users not already associated with a company
      data: { companyId: companyId }
    });
    console.log(`Assigned company NREUV to ${updatedUsers.count} users.`);
  } catch (e) {
    console.error('Error assigning company to users:', e);
  } finally {
    await prisma.$disconnect();
  }
}

assignCompanyToAllUsers();
