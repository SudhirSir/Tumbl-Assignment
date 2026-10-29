import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seed() {
  console.log('Seeding initial loan schemes and 24K gold rate...');

  // Seed standard schemes required by specification
  const schemes = [
    {
      id: 'PLAN_BULLET_01',
      name: 'Bullet Repayment',
      interestRate: 12.0,
      maxLtv: 0.70,
      tenureMonths: 12,
      description: '12 months, interest + principal at maturity',
      isActive: true,
    },
    {
      id: 'PLAN_EMI_01',
      name: 'Monthly EMI',
      interestRate: 10.5,
      maxLtv: 0.75,
      tenureMonths: 12,
      description: '12 months, equal monthly instalments',
      isActive: true,
    },
  ];

  for (const s of schemes) {
    await prisma.loanScheme.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }

  // Seed mock 24K gold rate (₹7,000 / gram)
  await prisma.goldRate.upsert({
    where: { id: 'CURRENT' },
    update: { rate24kPerGram: 7000 },
    create: { id: 'CURRENT', rate24kPerGram: 7000 },
  });

  console.log('Seeding completed successfully.');
}
