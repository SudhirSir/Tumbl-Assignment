# AI Development Log (AI_LOG.md)

As required by the assignment guidelines, this document transparently logs the AI tools utilized, exact prompts provided, and a detailed post-mortem of an AI error that was detected, diagnosed, and resolved with a unit test.

---

## 1. AI Tools Used & Purpose

* **Antigravity AI (Claude / Gemini 3.8 Flash)**:
  * Used for architectural scaffolding, financial calculation review, Zod schema generation, and full-stack React + Tailwind component generation.
* **Cursor / GitHub Copilot**:
  * Used for autocomplete suggestions during test scenario authoring and mock database fixture generation.

---

## 2. Two Exact Prompts Used During Development

### Prompt 1: Request Schema & Server-Side Financial Validation
```text
Write a strict Zod validation schema and Express middleware for a gold loan intake portal with the following business rules:
- Name: 2 to 60 characters, letters and spaces only.
- Mobile: 10-digit Indian number starting with 6, 7, 8, or 9 (regex: ^[6-9]\d{9}$).
- Weights: 0 < netWeightGrams <= grossWeightGrams <= 1000 grams.
- Karat: strictly one of [18, 22, 24].
- If net weight exceeds gross weight, output a field-level error specifically on 'netWeightGrams' with the message 'Net weight cannot exceed gross weight'.
- The error response must strictly adhere to the contract:
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "...",
      "fields": [{ "field": "...", "message": "..." }]
    }
  }
```

### Prompt 2: Agent Tools, Function Calling & Guardrails
```text
Implement an AI Loan Assist Agent for a gold loan portal with 3 function calling tools:
1. get_loan_schemes(): lists active schemes from the DB.
2. calculate_quote(grossWeightGrams, netWeightGrams, karat): calls the backend quote engine. The LLM must NEVER do arithmetic itself.
3. submit_application(payload): submits the loan application.

Guardrails:
- The agent must NEVER call submit_application without explicit, affirmative confirmation from the user after presenting a complete summary.
- The agent must decline off-topic queries (crypto, stocks, investment advice, weather, coding) with a polite refusal.
- Mobile numbers must be masked in conversational logs (e.g., 9876XXXX10).
- Tool arguments must be validated using the exact same Zod schemas as the REST API.
```

---

## 3. Place Where the AI Got It Wrong, How It Was Caught, and the Catching Test

### The Bug: Unfiltered Conversational Parsing Extracted Assistant Text as Borrower Name
* **What Happened:**
  During conversational intake, the assistant prompted:
  `"Please share your Name and Mobile."`
  The user responded:
  `"My name is Ramesh Kumar and mobile is 9876543210."`
  The AI's initial regex parser searched the full conversational buffer with:
  `/(?:my name is|name[:\s]+)([a-zA-Z\s]{2,40})/i`
  Because `name[:\s]+` matched `"Name and Mobile"` from the assistant's own prior prompt before reaching the user's message, the extracted borrower name was incorrectly parsed as:
  `applicantName = "and Mobile"`!

* **How It Was Spotted:**
  When executing the automated evaluation scenario `CONV_1_HAPPY_PATH` via `npm run eval`, the test failed with:
  ```text
  ❌ FAILED: Failed to submit or missing Application ID
  Agent Response:
  "Here is your application summary:
  - Applicant: and Mobile
  - Mobile: 9876XXXX10
  Would you like me to submit your application with these details?"
  ```
  The assistant summarized the borrower's name as `"and Mobile"` instead of `"Ramesh Kumar"`.

* **How It Was Fixed:**
  1. Separated user messages from assistant responses prior to regex extraction:
     ```ts
     const userMessagesText = messages
       .filter((m) => m.role === 'user')
       .map((m) => m.content)
       .join('\n');
     ```
  2. Refined the name extraction regex to cleanly isolate the name and strip trailing `"and mobile..."` clauses:
     ```ts
     const nameMatch = userMessagesText.match(/(?:my name is|name\s+is|name\s*[:=]\s*)([a-zA-Z\s]{2,40})/i);
     const applicantName = nameMatch[1].replace(/and\s+mobile.*/i, '').trim();
     ```

* **The Test That Now Catches It:**
  Automated in `server/src/agent/evals.ts` and `server/tests/agent.test.ts` under scenario `CONV_1_HAPPY_PATH`:
  ```ts
  expect(res.reply).not.toContain('and Mobile');
  expect(toolCall.args.applicantName).toBe('Ramesh Kumar');
  expect(toolCall.result.applicationId).toMatch(/^GL-\d+$/);
  ```
