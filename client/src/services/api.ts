export interface LoanScheme {
  id: string;
  name: string;
  interestRate: number;
  maxLtv: number;
  tenureMonths: number;
  description: string;
}

export interface SchemeQuoteOutput {
  planId: string;
  name: string;
  maxLtv: number;
  effectiveLtv: number;
  interestRate: number;
  tenureMonths: number;
  eligibleLoan: number;
}

export interface FullQuoteResult {
  netWeightGrams: number;
  grossWeightGrams: number;
  karat: number;
  rate24kPerGram: number;
  pureGoldGrams: number;
  goldValue: number;
  schemes: SchemeQuoteOutput[];
}

export interface LeadItem {
  applicationId: string;
  applicantName: string;
  maskedMobile: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  goldValue: number;
  eligibleLoan: number;
  status: string;
  planId: string;
  planName: string;
  source: string;
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Array<{ field: string; message: string }>;
  existingApplicationId?: string;
  appliedAt?: string;
}

const BASE_URL = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const error: ApiError = data.error || {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    };
    throw error;
  }
  return data.data;
}

export async function fetchLoanSchemes(): Promise<LoanScheme[]> {
  const res = await fetch(`${BASE_URL}/loan-schemes`);
  return handleResponse<LoanScheme[]>(res);
}

export async function fetchGoldRate(): Promise<{ rate24kPerGram: number; currency: string; updatedAt: string }> {
  const res = await fetch(`${BASE_URL}/gold-rate`);
  return handleResponse<{ rate24kPerGram: number; currency: string; updatedAt: string }>(res);
}

export async function calculateQuote(params: {
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
}): Promise<FullQuoteResult> {
  const res = await fetch(`${BASE_URL}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<FullQuoteResult>(res);
}

export async function submitLead(
  payload: {
    applicantName: string;
    mobileNumber: string;
    grossWeightGrams: number;
    netWeightGrams: number;
    karat: number;
    planId: string;
    source?: string;
  },
  idempotencyKey?: string
): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function fetchLeads(planId?: string): Promise<LeadItem[]> {
  const url = planId ? `${BASE_URL}/leads?planId=${encodeURIComponent(planId)}` : `${BASE_URL}/leads`;
  const res = await fetch(url);
  return handleResponse<LeadItem[]>(res);
}

export async function updateLeadStatus(id: string, status: string, note?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/leads/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note, changedBy: 'PORTAL_USER' }),
  });
  return handleResponse<any>(res);
}

export async function sendChatMessage(messages: Array<{ role: string; content: string }>): Promise<any> {
  const res = await fetch(`${BASE_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  return handleResponse<any>(res);
}
