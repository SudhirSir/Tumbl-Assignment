import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/leadService.js';
import { CreateLeadInput } from '../middleware/validate.js';

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || undefined;
    const { lead, statusCode } = await LeadService.submitLead(req.body as CreateLeadInput, idempotencyKey);

    res.status(statusCode).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const planId = (req.query.planId as string) || undefined;
    const leads = await LeadService.getLeads(planId);

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLeadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, note, changedBy } = req.body;

    const result = await LeadService.updateLeadStatus(id, status, changedBy, note);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
