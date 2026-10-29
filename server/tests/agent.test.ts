import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runEvals } from '../src/agent/evals.js';
import { prisma } from '../src/services/leadService.js';

describe('AI Loan Assist Agent Automated Evaluations', () => {
  beforeAll(async () => {
    await prisma.leadAuditLog.deleteMany();
    await prisma.lead.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should pass all required and bonus test conversations in the evaluation suite', async () => {
    const allPassed = await runEvals();
    expect(allPassed).toBe(true);
  });
});
