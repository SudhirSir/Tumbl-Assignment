/**
 * Financial calculation engine for gold valuation and loan eligibility.
 * 
 * Rules:
 * pureGoldGrams = netWeightGrams * (karat / 24)
 * goldValue = pureGoldGrams * rate24kPerGram
 * eligibleLoan = floor( goldValue * min(plan.maxLtv, 0.75) )
 * 
 * All monetary amounts are handled as integer rupees (or integer paise).
 * LTV is strictly capped at 75% (0.75).
 */

export interface CalculatePureGoldParams {
  netWeightGrams: number;
  karat: number;
}

export interface SchemeQuoteInput {
  id: string;
  name: string;
  maxLtv: number;
  interestRate: number;
  tenureMonths: number;
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

/**
 * Calculates pure gold weight in grams given net weight and karat.
 * Rounded to 4 decimal places to prevent standard JS floating-point artifacts.
 */
export function calculatePureGoldGrams(netWeightGrams: number, karat: number): number {
  if (netWeightGrams <= 0) {
    throw new Error('Net weight must be strictly positive');
  }
  if (![18, 22, 24].includes(karat)) {
    throw new Error(`Karat must be one of 18, 22, or 24. Received: ${karat}`);
  }

  const purityRatio = karat / 24;
  const rawPure = netWeightGrams * purityRatio;
  return Number(rawPure.toFixed(4));
}

/**
 * Calculates total gold market valuation based on 24K rate.
 * Returns integer rupees.
 */
export function calculateGoldValue(pureGoldGrams: number, rate24kPerGram: number): number {
  if (pureGoldGrams <= 0 || rate24kPerGram <= 0) {
    return 0;
  }
  // Math.round handles any fractional rupee from exact multiplication
  return Math.round(pureGoldGrams * rate24kPerGram);
}

/**
 * Calculates max eligible loan for a specific scheme.
 * Enforces hard regulatory cap of 75% LTV: eligibleLoan = floor(goldValue * min(plan.maxLtv, 0.75))
 * Always returns whole integer rupees.
 */
export function calculateEligibleLoan(goldValue: number, planMaxLtv: number): number {
  const effectiveLtv = Math.min(planMaxLtv, 0.75);
  return Math.floor(goldValue * effectiveLtv);
}

/**
 * Full quote calculation across available schemes.
 */
export function calculateFullQuote(
  grossWeightGrams: number,
  netWeightGrams: number,
  karat: number,
  schemes: SchemeQuoteInput[],
  rate24kPerGram: number = 7000
): FullQuoteResult {
  const pureGoldGrams = calculatePureGoldGrams(netWeightGrams, karat);
  const goldValue = calculateGoldValue(pureGoldGrams, rate24kPerGram);

  const schemeQuotes: SchemeQuoteOutput[] = schemes.map((scheme) => {
    const effectiveLtv = Math.min(scheme.maxLtv, 0.75);
    const eligibleLoan = calculateEligibleLoan(goldValue, scheme.maxLtv);

    return {
      planId: scheme.id,
      name: scheme.name,
      maxLtv: scheme.maxLtv,
      effectiveLtv,
      interestRate: scheme.interestRate,
      tenureMonths: scheme.tenureMonths,
      eligibleLoan,
    };
  });

  return {
    netWeightGrams,
    grossWeightGrams,
    karat,
    rate24kPerGram,
    pureGoldGrams,
    goldValue,
    schemes: schemeQuotes,
  };
}
