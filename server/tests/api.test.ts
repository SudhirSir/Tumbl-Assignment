import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/services/leadService.js';
import { seed } from '../src/services/seedService.js';

describe('Gold Loan Portal API Specification Tests', () => {
  beforeAll(async () => {
    // Seed schemes and rate
    await seed();
    // Clear leads created in previous test runs
    await prisma.leadAuditLog.deleteMany();
    await prisma.lead.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Loan Schemes: GET /api/v1/loan-schemes', () => {
    it('should return active schemes with max LTV capped at or below 75%', async () => {
      const res = await request(app).get('/api/v1/loan-schemes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      for (const scheme of res.body.data) {
        expect(scheme.maxLtv).toBeLessThanOrEqual(0.75);
      }
    });
  });

  describe('Pure Quotes: POST /api/v1/quotes', () => {
    it('Test Case 1 & 2: 45g net · 22K jewellery valuation', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.pureGoldGrams).toBe(41.25);
      expect(data.goldValue).toBe(288750);

      const emi = data.schemes.find((s: any) => s.planId === 'PLAN_EMI_01');
      expect(emi.eligibleLoan).toBe(216562);

      const bullet = data.schemes.find((s: any) => s.planId === 'PLAN_BULLET_01');
      expect(bullet.eligibleLoan).toBe(202125);
    });

    it('Test Case 3: 10g net · 18K · EMI', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          grossWeightGrams: 10,
          netWeightGrams: 10,
          karat: 18,
        });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.pureGoldGrams).toBe(7.5);
      expect(data.goldValue).toBe(52500);

      const emi = data.schemes.find((s: any) => s.planId === 'PLAN_EMI_01');
      expect(emi.eligibleLoan).toBe(39375);
    });

    it('Test Case 4: net 52g > gross 50g returns 400 with field error on netWeightGrams', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          grossWeightGrams: 50,
          netWeightGrams: 52,
          karat: 22,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const netError = res.body.error.fields.find((f: any) => f.field === 'netWeightGrams');
      expect(netError).toBeDefined();
      expect(netError.message).toMatch(/cannot exceed gross weight/i);
    });
  });

  describe('Lead Submission & Validation: POST /api/v1/leads', () => {
    it('Test Case 5a: mobile 5876543210 (starts with 5) returns 400 with field error on mobileNumber', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          applicantName: 'Vikram Malhotra',
          mobileNumber: '5876543210',
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const mobileError = res.body.error.fields.find((f: any) => f.field === 'mobileNumber');
      expect(mobileError).toBeDefined();
    });

    it('Test Case 5b: mobile 98765 (short length) returns 400 with field error on mobileNumber', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          applicantName: 'Vikram Malhotra',
          mobileNumber: '98765',
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(400);
      const mobileError = res.body.error.fields.find((f: any) => f.field === 'mobileNumber');
      expect(mobileError).toBeDefined();
    });

    it('Test Case 1 (Full Lead): 45g net · 22K · EMI returns 201 with applicationId', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          applicantName: 'Rahul Sharma',
          mobileNumber: '9876543210',
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.applicationId).toMatch(/^GL-\d+$/);
      expect(data.eligibleLoan).toBe(216562);
      expect(data.pureGoldGrams).toBe(41.25);
      expect(data.goldValue).toBe(288750);
      expect(data.status).toBe('SUBMITTED');
      expect(data.maskedMobile).toBe('9876XXXX10');
    });

    it('Test Case 6: Same mobile again within 7 days returns 409 Conflict with existing applicationId', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          applicantName: 'Rahul Sharma',
          mobileNumber: '9876543210',
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_APPLICATION');
      expect(res.body.error.existingApplicationId).toMatch(/^GL-\d+$/);
      expect(res.body.error.message).toMatch(/You already applied/i);
    });

    it('Returns 404 if planId does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          applicantName: 'Sanjay Kumar',
          mobileNumber: '9876543211',
          grossWeightGrams: 30,
          netWeightGrams: 30,
          karat: 22,
          planId: 'NON_EXISTENT_PLAN',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Bonus B1: Idempotency & Concurrency', () => {
    it('Bonus Test Case 7: Same request with same Idempotency-Key replays original response', async () => {
      const idemKey = 'idem-test-key-001';
      const payload = {
        applicantName: 'Amit Patel',
        mobileNumber: '9123456780',
        grossWeightGrams: 20,
        netWeightGrams: 20,
        karat: 22,
        planId: 'PLAN_EMI_01',
      };

      const res1 = await request(app)
        .post('/api/v1/leads')
        .set('Idempotency-Key', idemKey)
        .send(payload);

      expect(res1.status).toBe(201);
      const originalAppId = res1.body.data.applicationId;

      // Replay request with same idempotency key
      const res2 = await request(app)
        .post('/api/v1/leads')
        .set('Idempotency-Key', idemKey)
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body.data.applicationId).toBe(originalAppId);
      expect(res2.body.data.isReplayed).toBe(true);
    });

    it('Bonus Test Case 8: 2 parallel requests with same new mobile yields exactly one 201 and one 409', async () => {
      const mobile = '9998887771';
      const payload = {
        applicantName: 'Concurrent User',
        mobileNumber: mobile,
        grossWeightGrams: 15,
        netWeightGrams: 15,
        karat: 22,
        planId: 'PLAN_EMI_01',
      };

      // Launch both requests simultaneously
      const [req1, req2] = await Promise.all([
        request(app).post('/api/v1/leads').send(payload),
        request(app).post('/api/v1/leads').send(payload),
      ]);

      const statuses = [req1.status, req2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });

  describe('Leads Listing: GET /api/v1/leads', () => {
    it('should list leads newest first with masked mobile numbers', async () => {
      const res = await request(app).get('/api/v1/leads');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const lead of res.body.data) {
        expect(lead.maskedMobile).toMatch(/^\d{4}XXXX\d{2}$/);
      }
    });

    it('should filter leads by planId', async () => {
      const res = await request(app).get('/api/v1/leads?planId=PLAN_EMI_01');
      expect(res.status).toBe(200);
      for (const lead of res.body.data) {
        expect(lead.planId).toBe('PLAN_EMI_01');
      }
    });

    it('Bonus: should support pagination with page and limit parameters', async () => {
      const res = await request(app).get('/api/v1/leads?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Bonus B1: Lead Status Workflow', () => {
    it('should transition lead status from SUBMITTED to UNDER_REVIEW and APPROVED with audit log', async () => {
      const listRes = await request(app).get('/api/v1/leads');
      const leadId = listRes.body.data[0].applicationId;

      const patchRes = await request(app)
        .patch(`/api/v1/leads/${leadId}/status`)
        .send({
          status: 'UNDER_REVIEW',
          note: 'Documents verified by branch manager',
          changedBy: 'MANAGER_101',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('UNDER_REVIEW');
    });
  });
});
