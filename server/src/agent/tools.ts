import { prisma, LeadService } from '../services/leadService.js';
import { calculateFullQuote } from '../services/goldMath.js';
import { QuoteRequestSchema, CreateLeadSchema } from '../middleware/validate.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: 'get_loan_schemes',
    description: 'Retrieves all available and active gold loan schemes with interest rates, max LTV, and tenure.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'calculate_quote',
    description: 'Calculates the pure gold weight, market gold valuation, and eligible loan amount across all schemes. The AI must never calculate maths itself.',
    parameters: {
      type: 'object',
      properties: {
        grossWeightGrams: {
          type: 'number',
          description: 'Gross weight of gold jewellery in grams (0 < gross <= 1000)',
        },
        netWeightGrams: {
          type: 'number',
          description: 'Net gold weight excluding stones/enamel in grams (0 < net <= gross <= 1000)',
        },
        karat: {
          type: 'number',
          enum: [18, 22, 24],
          description: 'Purity of gold: 18, 22, or 24 karat',
        },
      },
      required: ['grossWeightGrams', 'netWeightGrams', 'karat'],
    },
  },
  {
    name: 'submit_application',
    description: 'Submits a gold loan application. ONLY call this after presenting a full summary and receiving explicit confirmation from the borrower.',
    parameters: {
      type: 'object',
      properties: {
        applicantName: {
          type: 'string',
          description: 'Borrower full name (2 to 60 characters, letters and spaces only)',
        },
        mobileNumber: {
          type: 'string',
          description: '10-digit Indian mobile number starting with 6, 7, 8, or 9',
        },
        grossWeightGrams: {
          type: 'number',
          description: 'Gross weight in grams',
        },
        netWeightGrams: {
          type: 'number',
          description: 'Net weight in grams',
        },
        karat: {
          type: 'number',
          enum: [18, 22, 24],
          description: 'Gold karat purity',
        },
        planId: {
          type: 'string',
          description: 'Selected scheme ID (e.g. PLAN_EMI_01 or PLAN_BULLET_01)',
        },
      },
      required: [
        'applicantName',
        'mobileNumber',
        'grossWeightGrams',
        'netWeightGrams',
        'karat',
        'planId',
      ],
    },
  },
  {
    name: 'check_existing_application',
    description: 'Checks if an applicant has already applied within the last 7 days using their mobile number.',
    parameters: {
      type: 'object',
      properties: {
        mobileNumber: {
          type: 'string',
          description: '10-digit Indian mobile number',
        },
      },
      required: ['mobileNumber'],
    },
  },
];

/**
 * Tool Execution Router: executes backend functions safely with Zod schema validation.
 */
export async function executeAgentTool(name: string, args: any): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    switch (name) {
      case 'get_loan_schemes': {
        const schemes = await prisma.loanScheme.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            interestRate: true,
            maxLtv: true,
            tenureMonths: true,
            description: true,
          },
        });
        return { success: true, result: schemes };
      }

      case 'calculate_quote': {
        // Validate tool arguments with the EXACT SAME Zod schema as API
        const validated = QuoteRequestSchema.safeParse(args);
        if (!validated.success) {
          const errMsg = validated.error.issues.map((i) => i.message).join('; ');
          return { success: false, error: errMsg };
        }

        const schemes = await prisma.loanScheme.findMany({ where: { isActive: true } });
        const goldRateRecord = await prisma.goldRate.findUnique({ where: { id: 'CURRENT' } });
        const rate24k = goldRateRecord?.rate24kPerGram || 7000;

        const quote = calculateFullQuote(
          validated.data.grossWeightGrams,
          validated.data.netWeightGrams,
          validated.data.karat,
          schemes,
          rate24k
        );

        return { success: true, result: quote };
      }

      case 'submit_application': {
        // Validate tool arguments with the EXACT SAME Zod schema as API
        const validated = CreateLeadSchema.safeParse({ ...args, source: 'AI_AGENT' });
        if (!validated.success) {
          const errMsg = validated.error.issues.map((i) => i.message).join('; ');
          return { success: false, error: errMsg };
        }

        const { lead } = await LeadService.submitLead(validated.data);
        return { success: true, result: lead };
      }

      case 'check_existing_application': {
        if (!args.mobileNumber || !/^[6-9]\d{9}$/.test(args.mobileNumber)) {
          return { success: false, error: 'Please provide a valid 10-digit Indian mobile number' };
        }
        const existing = await LeadService.findLatestByMobile(args.mobileNumber);
        return { success: true, result: existing || { message: 'No existing application found' } };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error occurred while executing tool',
    };
  }
}
