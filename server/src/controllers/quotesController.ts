import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/leadService.js';
import { calculateFullQuote } from '../services/goldMath.js';
import { QuoteRequestInput } from '../middleware/validate.js';

export async function calculateQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { grossWeightGrams, netWeightGrams, karat } = req.body as QuoteRequestInput;

    // Fetch active schemes from DB
    const schemes = await prisma.loanScheme.findMany({
      where: { isActive: true },
    });

    // Fetch current mock 24K rate
    const goldRateRecord = await prisma.goldRate.findUnique({
      where: { id: 'CURRENT' },
    });
    const rate24k = goldRateRecord?.rate24kPerGram || 7000;

    // Pure calculation - no database writes
    const quoteResult = calculateFullQuote(
      grossWeightGrams,
      netWeightGrams,
      karat,
      schemes,
      rate24k
    );

    res.status(200).json({
      success: true,
      data: quoteResult,
    });
  } catch (err) {
    next(err);
  }
}
