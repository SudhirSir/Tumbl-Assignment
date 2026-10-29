import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/leadService.js';

export async function getGoldRate(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rateRecord = await prisma.goldRate.findUnique({
      where: { id: 'CURRENT' },
    });

    res.status(200).json({
      success: true,
      data: {
        rate24kPerGram: rateRecord?.rate24kPerGram || 7000,
        currency: 'INR',
        unit: 'gram',
        updatedAt: rateRecord?.updatedAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
