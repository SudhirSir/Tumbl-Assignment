import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Standard Error Contract matching specification:
 * { error: { code, message, fields: [{ field, message }] } }
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Array<{ field: string; message: string }>;
    existingApplicationId?: string;
    appliedAt?: string;
  };
}

/**
 * Zod schema for Quote request: POST /api/v1/quotes
 */
export const QuoteRequestSchema = z
  .object({
    grossWeightGrams: z
      .number({ required_error: 'grossWeightGrams is required', invalid_type_error: 'grossWeightGrams must be a number' })
      .min(0.01, 'grossWeightGrams must be greater than 0')
      .max(1000, 'grossWeightGrams cannot exceed 1000 grams'),
    netWeightGrams: z
      .number({ required_error: 'netWeightGrams is required', invalid_type_error: 'netWeightGrams must be a number' })
      .min(0.01, 'netWeightGrams must be greater than 0')
      .max(1000, 'netWeightGrams cannot exceed 1000 grams'),
    karat: z
      .number({ required_error: 'karat is required', invalid_type_error: 'karat must be a number' })
      .refine((val) => [18, 22, 24].includes(val), {
        message: 'Karat must be one of 18, 22, or 24',
      }),
  })
  .refine((data) => data.netWeightGrams <= data.grossWeightGrams, {
    message: 'Net weight cannot exceed gross weight',
    path: ['netWeightGrams'],
  });

export type QuoteRequestInput = z.infer<typeof QuoteRequestSchema>;

/**
 * Zod schema for Lead submission: POST /api/v1/leads
 */
export const CreateLeadSchema = z
  .object({
    applicantName: z
      .string({ required_error: 'applicantName is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    mobileNumber: z
      .string({ required_error: 'mobileNumber is required' })
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Mobile must be a valid 10-digit Indian number starting with 6-9'),
    grossWeightGrams: z
      .number({ required_error: 'grossWeightGrams is required' })
      .min(0.01, 'Gross weight must be greater than 0')
      .max(1000, 'Gross weight cannot exceed 1000 grams'),
    netWeightGrams: z
      .number({ required_error: 'netWeightGrams is required' })
      .min(0.01, 'Net weight must be greater than 0')
      .max(1000, 'Net weight cannot exceed 1000 grams'),
    karat: z
      .number({ required_error: 'karat is required' })
      .refine((val) => [18, 22, 24].includes(val), {
        message: 'Karat must be one of 18, 22, or 24',
      }),
    planId: z
      .string({ required_error: 'planId is required' })
      .min(1, 'planId is required'),
    source: z.enum(['FORM', 'AI_AGENT']).optional().default('FORM'),
  })
  .refine((data) => data.netWeightGrams <= data.grossWeightGrams, {
    message: 'Net weight cannot exceed gross weight',
    path: ['netWeightGrams'],
  });

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

/**
 * Express middleware to validate request body using any Zod schema.
 * Formats errors strictly into { error: { code, message, fields } }.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fields = err.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        }));

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed for request parameters',
            fields,
          },
        });
        return;
      }
      next(err);
    }
  };
}
