# Architecture & System Design Document (ARCHITECTURE.md)

## 1. System Philosophy: "Same Truth, Two Paths"

The **Gold Loan Intake Portal** provides two entry channels for borrowers and field agents:
1. **Guided 3-Step Web Portal Flow** (Structured, live validation, debounced quote calculation).
2. **AI Loan Assist Chat Assistant** (Conversational, tool-calling agent with strict guardrails).

Crucially, **both paths execute against the exact same backend service layer**:
* The AI agent never performs financial arithmetic itself. Every number is produced by the server's `goldMath` engine via `calculate_quote`.
* Every application filed through either the web form or the AI agent is validated with the exact same **Zod** schemas, recomputed server-side, and stored in the same database table with identical financial precision.

```
                      ┌──────────────────────────────────────────────┐
                      │                 Client Layer                 │
                      │  (React 18 + Vite + Tailwind CSS + Lucide)   │
                      └──────────────┬────────────────┬──────────────┘
                                     │                │
                        [REST Calls] │                │ [Chat SSE / REST]
                                     ▼                ▼
                      ┌──────────────────────────────────────────────┐
                      │              Express.js Router               │
                      │    (Rate Limiting, CORS, Uniform Errors)     │
                      └──────────────┬────────────────┬──────────────┘
                                     │                │
                                     ▼                ▼
                      ┌──────────────────────┐  ┌─────────────────────┐
                      │   Validation Layer   │  │   AI Agent Layer    │
                      │    (Zod Schemas)     │  │ (3 Tools, Guardrails│
                      └──────────────┬───────┘  └──────────┬──────────┘
                                     │                     │
                                     └──────────┬──────────┘
                                                │
                                                ▼
                               ┌───────────────────────────────────┐
                               │       Shared Service Layer        │
                               │   - goldMath (Exact paise/floor)  │
                               │   - leadService (Mutex, 7-day deup│
                               │   - rateService (Cached 24k rate) │
                               └────────────────┬──────────────────┘
                                                │
                                                ▼
                               ┌───────────────────────────────────┐
                               │          Database Layer           │
                               │    (Prisma ORM + SQLite/Postgres) │
                               │  - LoanScheme, Lead, AuditLog     │
                               └───────────────────────────────────┘
```

---

## 2. Financial Math Engine (`goldMath.ts`)

All financial computations adhere strictly to RBI/regulatory gold loan constraints:
$$\text{pureGoldGrams} = \text{netWeightGrams} \times \left(\frac{\text{karat}}{24}\right)$$
$$\text{goldValue} = \text{pureGoldGrams} \times \text{rate24kPerGram}$$
$$\text{eligibleLoan} = \lfloor \text{goldValue} \times \min(\text{plan.maxLtv}, 0.75) \rfloor$$

### Precision Guarantees
* **No Floating-Point Money**: Loan amounts are rounded/floored to whole integer rupees.
* **Hard 75% Regulatory Ceiling**: Even if a loan scheme in the database is configured with an LTV > 75%, `Math.min(plan.maxLtv, 0.75)` guarantees the effective LTV never breaches the regulatory cap.
* **Pure Gold Precision**: Pure gold calculations are normalized to 4 decimal places before value multiplication to prevent IEEE 754 precision artifacts.

---

## 3. Data Integrity, Deduplication & Concurrency (Bonus B1)

### 7-Day Mobile Deduplication
When `POST /api/v1/leads` is invoked, the service queries for any existing record with the same `mobileNumber` where `createdAt >= now() - 7 days`. If found, it immediately responds with `409 Conflict`:
```json
{
  "error": {
    "code": "DUPLICATE_APPLICATION",
    "message": "You already applied on 3 Oct, application GL-1042",
    "existingApplicationId": "GL-1042",
    "appliedAt": "2026-10-03T10:00:00.000Z"
  }
}
```

### Concurrency Protection (Parallel Request Safety)
To prevent race conditions where two simultaneous requests with the same new mobile number hit the server at the exact same millisecond:
* An in-process **Mobile Mutex Lock** (`mobileMutexMap`) serializes requests per mobile number.
* The first request acquires the lock, verifies deduplication, inserts the lead, and commits.
* The second request acquires the lock immediately after, detects the newly inserted lead, and returns `409 Conflict`.
* **Verified by automated concurrency test**: 2 parallel requests yield exactly one `201 Created` and one `409 Conflict`.

### Idempotency Key Replay (Bonus B1)
Clients can send an `Idempotency-Key` header with `POST /api/v1/leads`.
* If a request with the same idempotency key was previously processed, the original `201` response payload is replayed directly with status `200` and `isReplayed: true`.

---

## 4. AI Loan Assist Agent Architecture (Part B)

### Typed Function Calling
The assistant exposes 3 primary tools (+ 1 bonus lookup tool):
1. `get_loan_schemes()`: Returns active schemes and rates. The assistant may only describe plans returned by this tool.
2. `calculate_quote(grossWeightGrams, netWeightGrams, karat)`: Calls the quote calculation engine. The LLM is forbidden from doing mental math.
3. `submit_application(payload)`: Submits the loan application. Only invoked after presenting a full summary and receiving explicit user confirmation.
4. `check_existing_application(mobileNumber)`: Look up an existing application status.

### Security Guardrails
* **Prompt Injection Defense**: Evaluates inputs against adversarial patterns (`ignore previous instructions`, `DAN mode`) and refuses override attempts.
* **Investment Advice Rejection**: Rejects questions regarding stock picks, gold price predictions, or crypto.
* **Zero PII Leakage**: Mobile numbers are masked in logs as `9876XXXX10`.

---

## 5. Audit Logging & Status Workflow (Bonus B1)

Each lead moves through a status lifecycle:
$$\text{SUBMITTED} \longrightarrow \text{UNDER\_REVIEW} \longrightarrow \text{APPROVED} \text{ or } \text{REJECTED}$$

Every transition writes an immutable record to `LeadAuditLog`:
* `leadId`: Associated application ID
* `fromStatus`: Previous state
* `toStatus`: New state
* `changedBy`: User / System ID
* `note`: Verification comments
* `createdAt`: Timestamp
