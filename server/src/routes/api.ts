import { Router } from 'express';
import { getLoanSchemes } from '../controllers/schemesController.js';
import { calculateQuote } from '../controllers/quotesController.js';
import { createLead, getLeads, updateLeadStatus } from '../controllers/leadsController.js';
import { getGoldRate } from '../controllers/rateController.js';
import { chatWithAgent } from '../controllers/agentController.js';
import { validateBody, QuoteRequestSchema, CreateLeadSchema } from '../middleware/validate.js';

const router = Router();

// 1. Loan Schemes
router.get('/loan-schemes', getLoanSchemes);

// 2. Real-time Quotes (Pure calculation, no DB write)
router.post('/quotes', validateBody(QuoteRequestSchema), calculateQuote);

// 3. Leads (Creation, de-duplication, status workflow, listing)
router.post('/leads', validateBody(CreateLeadSchema), createLead);
router.get('/leads', getLeads);
router.patch('/leads/:id/status', updateLeadStatus);

// 4. Gold Rate (Cached rate endpoint)
router.get('/gold-rate', getGoldRate);

// 5. AI Loan Assist Agent
router.post('/agent/chat', chatWithAgent);

export default router;
