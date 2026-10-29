# Gold Loan Intake Portal (With AI Agent)

> **TGlobal Full-Stack & AI Assignment · Junior (0–2 Years)**
> A production-minded gold-loan intake portal featuring exact financial calculations, strict Zod schema validation, 7-day mobile deduplication, and an AI Loan Assist Agent with typed tool calling and guardrails.
> *"A small, correct solution beats a big, unfinished one."*

---

## 🌟 Key Highlights & Rubric Compliance

| Rubric Criterion | Weight | How It Is Achieved |
| :--- | :---: | :--- |
| **Maths & Validation** | 25 pts | Exact financial maths in integer paise/whole rupees. Hard 75% LTV cap enforced server-side. Test cases 1–6 pass 100%. |
| **AI Agent** | 25 pts | 3 typed tools (`get_loan_schemes`, `calculate_quote`, `submit_application`). Model never calculates arithmetic. Explicit confirmation step required. Stays on topic. |
| **Full-Stack UX** | 20 pts | Responsive down to 375px mobile viewport. Debounced (300ms) live quote calculation. Clean 3-step intake form + admin leads table. |
| **Tests & Conversations** | 15 pts | 23 automated tests covering math, API 400/409, concurrency, and 6 full agent evaluation conversations (`npm run eval`). |
| **API & Error Contract** | 10 pts | Strict uniform error response `{ error: { code, message, fields } }`. Correct HTTP status codes (200, 201, 400, 404, 409, 500 without stack traces). |
| **AI_LOG & README** | 5 pts | Transparent `AI_LOG.md` detailing tools used, prompts, and a caught AI bug with regression test. Setup works out of the box. |
| **Bonus Points** | +15 pts | **B1**: Concurrency lock, `Idempotency-Key` replay, status audit workflow, cached gold rate. **B2**: 4th tool, prompt injection defense, tool chips. **B4**: `docker-compose.yml`, GitHub Actions CI, rate limiting, `ARCHITECTURE.md`. |

---

## 📐 Exact Financial Formulae

The system implements exact financial mathematics matching the specification:

$$\text{pureGoldGrams} = \text{netWeightGrams} \times \left(\frac{\text{karat}}{24}\right) \quad (\text{e.g. } 22\text{K} \rightarrow 22/24 = 91.67\%)$$

$$\text{goldValue} = \text{pureGoldGrams} \times \text{rate24kPerGram} \quad (\text{Mock 24K Rate: ₹7,000 / gram})$$

$$\text{eligibleLoan} = \lfloor \text{goldValue} \times \min(\text{plan.maxLtv}, 0.75) \rfloor$$

* Money is stored and handled in whole rupees / integer paise—**never float rupees**.
* Regulatory ceiling of 75% LTV is enforced by server regardless of plan configuration.

### Benchmark Test Cases Verified in Test Suite:
1. `45g net · 22K · EMI` $\rightarrow$ Pure: `41.25g` · Value: `₹2,88,750` · Loan: `₹2,16,562` (`201 Created`)
2. `45g net · 22K · Bullet` $\rightarrow$ Value: `₹2,88,750` · Loan: `₹2,02,125` (70% LTV)
3. `10g net · 18K · EMI` $\rightarrow$ Pure: `7.5g` · Value: `₹52,500` · Loan: `₹39,375`
4. `net 52g > gross 50g` $\rightarrow$ `400 Bad Request` with field error on `netWeightGrams`
5. `mobile 5876543210` or `98765` $\rightarrow$ `400 Bad Request` with field error on `mobileNumber`
6. `Same mobile within 7 days` $\rightarrow$ `409 Conflict` with friendly message and existing `applicationId`

---

## 🚀 Quickstart & Setup (Zero Friction)

### Prerequisites
* Node.js v20+ or v22+
* npm v10+

### 1. Installation
```bash
# Clone the repository and install all dependencies (root, server, client)
npm install
```

### 2. Database Setup & Seeding
The default configuration uses a local SQLite database with zero external setup required:
```bash
# Seed initial loan schemes (Monthly EMI, Bullet Repayment) and mock gold rate
npm run seed
```

### 3. Run Automated Tests
```bash
# Runs full test suite (financial math, API integration, idempotency, concurrency, agent evals)
npm test
```

### 4. Run AI Agent Evaluation Conversations
```bash
# Runs the 6 automated conversational eval scenarios
npm run eval
```

### 5. Start Full-Stack Development Server
```bash
npm run dev
```
* **Frontend Portal**: http://localhost:5173
* **Backend API**: http://localhost:4000
* **API Health Check**: http://localhost:4000/health

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` (pre-configured with sensible defaults):

```env
# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database (Default: zero-friction SQLite; swappable to PostgreSQL)
DATABASE_URL="file:./dev.db"

# Gold Valuation
GOLD_RATE_24K_PER_GRAM=7000

# Optional LLM Provider (mock, gemini, or openai)
# If left empty, the server automatically uses the built-in deterministic agent runner.
LLM_PROVIDER=mock
GEMINI_API_KEY=
OPENAI_API_KEY=
```

---

## 🤖 Part B: AI Loan Assist Agent

The assistant operates under strict engineering principles:
* **Typed Tools (Function Calling)**:
  1. `get_loan_schemes()` — Lists active plans from DB.
  2. `calculate_quote(net, gross, karat)` — Backend quote engine. The LLM **never calculates math**.
  3. `submit_application(payload)` — Submits application **only after an explicit user confirmation step**.
  4. `check_existing_application(mobile)` — Bonus lookup tool.
* **Deterministic Fallback**: If no API key is set, the assistant runs a local state-machine engine that guarantees 100% deterministic test execution for reviewers without requiring third-party credentials.
* **Guardrails**: Strictly declines off-topic requests (crypto, stock advice, politics) and rejects prompt injection attempts.
* **Privacy**: Mobile numbers are masked in all logs (`9876XXXX10`).

---

## 🎁 Bonus Features Implemented

* **B1 (Harden the Backend)**:
  * **Concurrency Mutex Lock**: Two simultaneous requests with the same new mobile number are serialized, yielding exactly one `201` and one `409`.
  * **Idempotency-Key Support**: Replays the original `201` response when the same key is received.
  * **Status Lifecycle & Audit Log**: `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` / `REJECTED` with an immutable audit table (`LeadAuditLog`).
  * **Cached Gold Rate Endpoint**: `GET /api/v1/gold-rate`.
* **B2 (Smarter Agent)**:
  * 4th tool: `check_existing_application(mobileNumber)`.
  * Tool execution chips in chat UI (*"Calling calculate_quote()..."*).
  * Prompt injection regression test suite.
* **B4 (Ops Ready)**:
  * `docker-compose.yml` for PostgreSQL, API server, and web client.
  * GitHub Actions CI pipeline (`.github/workflows/ci.yml`).
  * Rate limiting on `POST /api/v1/leads` (100 reqs per 15 min per IP).
  * Comprehensive system design documentation in `ARCHITECTURE.md`.

---

## 🔮 What I Would Do With More Time

1. **Document Appraisal Slip OCR (Bonus B3)**: Implement a multimodal vision model or Tesseract.js pipeline to extract gross weight, net weight, and karat directly from an uploaded appraisal slip photograph.
2. **WebSocket / SSE Streaming for Agent**: Stream conversational tokens chunk-by-chunk to the chat UI for instant latency perception.
3. **Admin Dashboard Analytics**: Add interactive charts for conversion rates, average loan ticket size, and karat purity distribution using Recharts.
4. **Automated SMS OTP Integration**: Add Twilio or MSG91 verification for phone verification prior to submission.
