/**
 * Guardrail filters for borrower input and agent safety
 */

export interface GuardrailCheckResult {
  isOffTopic: boolean;
  isInjectionAttempt: boolean;
  isInvestmentAdviceRequest: boolean;
  rejectionMessage?: string;
}

const OFF_TOPIC_KEYWORDS = [
  'crypto',
  'bitcoin',
  'ethereum',
  'dogecoin',
  'mutual fund',
  'stock market',
  'share market',
  'nifty',
  'sensex',
  'weather',
  'write code',
  'python',
  'recipe',
  'politics',
  'election',
  'movie',
];

const INVESTMENT_ADVICE_KEYWORDS = [
  'should i buy gold',
  'is gold price going up',
  'best investment',
  'good time to sell gold',
  'predict gold price',
  'should i invest',
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /you\s+are\s+now\s+a\s+different/i,
  /system\s+prompt/i,
  /bypass\s+rules/i,
  /dan\s+mode/i,
  /jailbreak/i,
];

export function evaluateGuardrails(userMessage: string): GuardrailCheckResult {
  const lower = userMessage.toLowerCase();

  // 1. Check prompt injection attacks
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        isOffTopic: true,
        isInjectionAttempt: true,
        isInvestmentAdviceRequest: false,
        rejectionMessage:
          'I am designed strictly to assist with gold loan calculations and applications within our lending guidelines. I cannot modify my system instructions.',
      };
    }
  }

  // 2. Check investment advice requests
  for (const keyword of INVESTMENT_ADVICE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        isOffTopic: true,
        isInjectionAttempt: false,
        isInvestmentAdviceRequest: true,
        rejectionMessage:
          'I cannot provide financial or investment advice regarding gold price trends or whether to buy or sell gold. I can only assist you with estimating and applying for a gold loan against your physical jewellery.',
      };
    }
  }

  // 3. Check generic off-topic requests
  for (const keyword of OFF_TOPIC_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        isOffTopic: true,
        isInjectionAttempt: false,
        isInvestmentAdviceRequest: false,
        rejectionMessage:
          'I am here specifically to assist with Gold Loan inquiries, valuations, and applications. I cannot assist with unrelated topics. Would you like to check how much loan you can get against your gold jewellery?',
      };
    }
  }

  return {
    isOffTopic: false,
    isInjectionAttempt: false,
    isInvestmentAdviceRequest: false,
  };
}
