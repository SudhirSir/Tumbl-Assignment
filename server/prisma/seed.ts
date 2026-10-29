import { seed } from '../src/services/seedService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

seed()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
