import { PrismaClient, Lead } from '@prisma/client';
import { calculatePureGoldGrams, calculateGoldValue, calculateEligibleLoan } from './goldMath.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateLeadInput } from '../middleware/validate.js';

export const prisma = new PrismaClient();

/**
 * Masks a 10-digit mobile number as 9876XXXX10 (first 4 digits, 4 Xs, last 2 digits)
 */
export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 10) return mobile;
  return `${mobile.slice(0, 4)}XXXX${mobile.slice(-2)}`;
}

/**
 * Concurrency mutex locks for mobile numbers to prevent race conditions during duplicate checks
 */
const mobileMutexMap = new Map<string, Promise<void>>();

async function acquireMobileLock(mobile: string): Promise<() => void> {
  while (mobileMutexMap.has(mobile)) {
    await mobileMutexMap.get(mobile);
  }

  let releaseLock: () => void = () => {};
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  mobileMutexMap.set(mobile, lockPromise);

  return () => {
    mobileMutexMap.delete(mobile);
    releaseLock();
  };
}

export interface CreateLeadResult {
  applicationId: string;
  status: string;
  applicantName: string;
  maskedMobile: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
  planId: string;
  planName: string;
  source: string;
  createdAt: string;
  isReplayed?: boolean;
}

export class LeadService {
  /**
   * Submits a new loan application / lead with full server-side recalculation,
   * 7-day de-duplication, idempotency support, and concurrency safety.
   */
  static async submitLead(
    input: CreateLeadInput,
    idempotencyKey?: string
  ): Promise<{ lead: CreateLeadResult; statusCode: number }> {
    // 1. Idempotency Check (Bonus B1): Replay if same key was used
    if (idempotencyKey) {
      const existingKeyLead = await prisma.lead.findUnique({
        where: { idempotencyKey },
        include: { plan: true },
      });

      if (existingKeyLead) {
        return {
          statusCode: 200,
          lead: {
            applicationId: existingKeyLead.id,
            status: existingKeyLead.status,
            applicantName: existingKeyLead.applicantName,
            maskedMobile: maskMobile(existingKeyLead.mobileNumber),
            grossWeightGrams: existingKeyLead.grossWeightGrams,
            netWeightGrams: existingKeyLead.netWeightGrams,
            karat: existingKeyLead.karat,
            pureGoldGrams: existingKeyLead.pureGoldGrams,
            goldValue: existingKeyLead.goldValue,
            eligibleLoan: existingKeyLead.eligibleLoan,
            planId: existingKeyLead.planId,
            planName: existingKeyLead.plan.name,
            source: existingKeyLead.source,
            createdAt: existingKeyLead.createdAt.toISOString(),
            isReplayed: true,
          },
        };
      }
    }

    // 2. Concurrency Lock on mobile number to guarantee that parallel requests
    // with the same mobile will be serialized, yielding exactly one 201 and one 409
    const releaseLock = await acquireMobileLock(input.mobileNumber);

    try {
      // 3. Duplicate Application Check within 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentLead = await prisma.lead.findFirst({
        where: {
          mobileNumber: input.mobileNumber,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentLead) {
        const dateStr = recentLead.createdAt.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        });
        throw new AppError(
          409,
          'DUPLICATE_APPLICATION',
          `You already applied on ${dateStr}, application ${recentLead.id}`,
          undefined,
          {
            existingApplicationId: recentLead.id,
            appliedAt: recentLead.createdAt.toISOString(),
          }
        );
      }

      // 4. Validate that selected plan exists in DB (else 404)
      const plan = await prisma.loanScheme.findUnique({
        where: { id: input.planId },
      });

      if (!plan || !plan.isActive) {
        throw new AppError(404, 'NOT_FOUND', `Loan plan with ID '${input.planId}' does not exist or is inactive`);
      }

      // 5. Fetch current gold rate
      const goldRateRecord = await prisma.goldRate.findUnique({
        where: { id: 'CURRENT' },
      });
      const rate24k = goldRateRecord?.rate24kPerGram || 7000;

      // 6. Server-side Financial Recalculation (Never trust client numbers)
      const pureGoldGrams = calculatePureGoldGrams(input.netWeightGrams, input.karat);
      const goldValue = calculateGoldValue(pureGoldGrams, rate24k);
      const eligibleLoan = calculateEligibleLoan(goldValue, plan.maxLtv);

      // 7. Generate friendly Application ID (e.g. GL-1042)
      const leadCount = await prisma.lead.count();
      const applicationId = `GL-${1000 + leadCount + 1}`;

      // 8. Store lead and initial audit log in transaction
      const newLead = await prisma.$transaction(async (tx) => {
        const lead = await tx.lead.create({
          data: {
            id: applicationId,
            applicantName: input.applicantName,
            mobileNumber: input.mobileNumber,
            grossWeightGrams: input.grossWeightGrams,
            netWeightGrams: input.netWeightGrams,
            karat: input.karat,
            pureGoldGrams,
            goldValue,
            eligibleLoan,
            status: 'SUBMITTED',
            planId: plan.id,
            idempotencyKey: idempotencyKey || null,
            source: input.source || 'FORM',
          },
        });

        await tx.leadAuditLog.create({
          data: {
            leadId: applicationId,
            fromStatus: null,
            toStatus: 'SUBMITTED',
            changedBy: input.source === 'AI_AGENT' ? 'AI_AGENT' : 'BORROWER_PORTAL',
            note: 'Application created and initial quote verified by server',
          },
        });

        return lead;
      });

      return {
        statusCode: 201,
        lead: {
          applicationId: newLead.id,
          status: newLead.status,
          applicantName: newLead.applicantName,
          maskedMobile: maskMobile(newLead.mobileNumber),
          grossWeightGrams: newLead.grossWeightGrams,
          netWeightGrams: newLead.netWeightGrams,
          karat: newLead.karat,
          pureGoldGrams: newLead.pureGoldGrams,
          goldValue: newLead.goldValue,
          eligibleLoan: newLead.eligibleLoan,
          planId: plan.id,
          planName: plan.name,
          source: newLead.source,
          createdAt: newLead.createdAt.toISOString(),
        },
      };
    } finally {
      releaseLock();
    }
  }

  /**
   * Retrieves all leads, newest first, with mobile numbers masked
   */
  static async getLeads(planId?: string) {
    const whereClause: any = {};
    if (planId) {
      whereClause.planId = planId;
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        plan: {
          select: { name: true, interestRate: true, maxLtv: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((lead) => ({
      applicationId: lead.id,
      applicantName: lead.applicantName,
      maskedMobile: maskMobile(lead.mobileNumber),
      grossWeightGrams: lead.grossWeightGrams,
      netWeightGrams: lead.netWeightGrams,
      karat: lead.karat,
      pureGoldGrams: lead.pureGoldGrams,
      goldValue: lead.goldValue,
      eligibleLoan: lead.eligibleLoan,
      status: lead.status,
      planId: lead.planId,
      planName: lead.plan.name,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
    }));
  }

  /**
   * Updates lead status with audit logging (Bonus B1 status workflow)
   */
  static async updateLeadStatus(
    leadId: string,
    newStatus: string,
    changedBy = 'ADMIN',
    note?: string
  ) {
    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError(400, 'INVALID_STATUS', `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      throw new AppError(404, 'NOT_FOUND', `Lead with ID ${leadId} not found`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id: leadId },
        data: { status: newStatus },
      });

      await tx.leadAuditLog.create({
        data: {
          leadId,
          fromStatus: existingLead.status,
          toStatus: newStatus,
          changedBy,
          note: note || `Status updated from ${existingLead.status} to ${newStatus}`,
        },
      });

      return lead;
    });

    return {
      applicationId: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Check existing application by mobile number (Bonus B2 4th tool)
   */
  static async findLatestByMobile(mobileNumber: string) {
    const lead = await prisma.lead.findFirst({
      where: { mobileNumber },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!lead) return null;

    return {
      applicationId: lead.id,
      status: lead.status,
      applicantName: lead.applicantName,
      maskedMobile: maskMobile(lead.mobileNumber),
      eligibleLoan: lead.eligibleLoan,
      planName: lead.plan.name,
      createdAt: lead.createdAt.toISOString(),
    };
  }
}
