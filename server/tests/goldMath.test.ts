import { describe, it, expect } from 'vitest';
import {
  calculatePureGoldGrams,
  calculateGoldValue,
  calculateEligibleLoan,
  calculateFullQuote,
} from '../src/services/goldMath.js';

describe('Gold Loan Financial Calculations Engine', () => {
  const rate24k = 7000;
  const mockSchemes = [
    {
      id: 'PLAN_EMI_01',
      name: 'Monthly EMI',
      maxLtv: 0.75,
      interestRate: 10.5,
      tenureMonths: 12,
    },
    {
      id: 'PLAN_BULLET_01',
      name: 'Bullet Repayment',
      maxLtv: 0.70,
      interestRate: 12.0,
      tenureMonths: 12,
    },
  ];

  describe('Test Case 1: 45g net · 22K · EMI', () => {
    it('should compute pure 41.25g, value ₹2,88,750, loan ₹2,16,562', () => {
      const pureGold = calculatePureGoldGrams(45, 22);
      expect(pureGold).toBe(41.25);

      const goldValue = calculateGoldValue(pureGold, rate24k);
      expect(goldValue).toBe(288750);

      const eligibleLoan = calculateEligibleLoan(goldValue, 0.75);
      expect(eligibleLoan).toBe(216562);
    });
  });

  describe('Test Case 2: 45g net · 22K · Bullet', () => {
    it('should compute value ₹2,88,750, loan ₹2,02,125 (70% LTV)', () => {
      const pureGold = calculatePureGoldGrams(45, 22);
      const goldValue = calculateGoldValue(pureGold, rate24k);
      expect(goldValue).toBe(288750);

      const eligibleLoan = calculateEligibleLoan(goldValue, 0.70);
      expect(eligibleLoan).toBe(202125);
    });
  });

  describe('Test Case 3: 10g net · 18K · EMI', () => {
    it('should compute pure 7.5g, value ₹52,500, loan ₹39,375', () => {
      const pureGold = calculatePureGoldGrams(10, 18);
      expect(pureGold).toBe(7.5);

      const goldValue = calculateGoldValue(pureGold, rate24k);
      expect(goldValue).toBe(52500);

      const eligibleLoan = calculateEligibleLoan(goldValue, 0.75);
      expect(eligibleLoan).toBe(39375);
    });
  });

  describe('Regulatory Caps & Boundaries', () => {
    it('should never exceed 75% LTV even if plan maxLtv is misconfigured higher', () => {
      const goldValue = 100000;
      // Plan with 85% LTV should be clamped to 75%
      const loan = calculateEligibleLoan(goldValue, 0.85);
      expect(loan).toBe(75000);
    });

    it('should floor loan to whole rupees', () => {
      // 100001 * 0.75 = 75000.75 -> floored to 75000
      const loan = calculateEligibleLoan(100001, 0.75);
      expect(loan).toBe(75000);
    });

    it('should throw error for unsupported karat', () => {
      expect(() => calculatePureGoldGrams(10, 20)).toThrow(/Karat must be one of 18, 22, or 24/);
    });

    it('should throw error for negative or zero weight', () => {
      expect(() => calculatePureGoldGrams(0, 22)).toThrow(/strictly positive/);
      expect(() => calculatePureGoldGrams(-5, 22)).toThrow(/strictly positive/);
    });
  });

  describe('Full Quote Generation', () => {
    it('should correctly build full quote structure across all plans', () => {
      const quote = calculateFullQuote(45, 45, 22, mockSchemes, 7000);
      expect(quote.pureGoldGrams).toBe(41.25);
      expect(quote.goldValue).toBe(288750);
      expect(quote.schemes).toHaveLength(2);

      const emi = quote.schemes.find((s) => s.planId === 'PLAN_EMI_01');
      expect(emi?.eligibleLoan).toBe(216562);

      const bullet = quote.schemes.find((s) => s.planId === 'PLAN_BULLET_01');
      expect(bullet?.eligibleLoan).toBe(202125);
    });
  });
});
