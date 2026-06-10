const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function main() {
  await prisma.onboardingRequest.create({
    data: {
      name: '이수민',
      phone: '010-9876-5432',
      address: '서울시 서초구 서초대로 456',
      birthDate: '1995-05-15',
      ssnSuffix: '2345678',
      bankAccount: '신한은행 110-123-456789',
      status: 'PENDING_TL',
      documents: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });
  console.log('Seeded a pending approval request directly into prisma/dev.db');
}

main().catch(console.error).finally(() => prisma.$disconnect());
