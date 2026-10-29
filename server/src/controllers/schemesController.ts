import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/leadService.js';

export async function getLoanSchemes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
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
      orderBy: { interestRate: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: schemes,
    });
  } catch (err) {
    next(err);
  }
}
