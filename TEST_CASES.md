# Test cases — Recourse v1

All P0 tests must pass before ship. P1 tests should pass; document exceptions if not. P2 tests are known limitations.

Test cases use this format:

```
TC-<category>-<number>
Priority: P0 | P1 | P2
Category: Correctness | Grounding | Edge | Refusal | UX | Performance | Security
Input: <what you feed the system>
Expected: <what should happen>
```

---

## Correctness tests (agent decisions)

### TC-C-01 — Standard non-return in Bangalore
**Priority:** P0
**Input:**
- State: Karnataka, City: Bangalore
- Rent: ₹35,000/month
- Deposit: ₹95,000
- Tenancy: 2024-01-15 to 2025-06-30
- Situation: "Landlord not returning deposit"
- Days since vacation: 45
- Evidence: rent agreement, bank transfer, WhatsApp

**Expected:**
- `situation_type: 'non_return'`
- `primary_forum: 'legal_notice'`
- `secondary_forum: 'consumer_commission'`
- Draft cites Karnataka Rent Act Sec 12, CPA 2019 Sec 2(11)
- Evidence checklist includes rent agreement, bank transfer, WhatsApp chats as attached; recommends move-out photos

### TC-C-02 — Vague deductions in Mumbai
**Priority:** P0
**Input:**
- State: Maharashtra, City: Mumbai
- Rent: ₹55,000/month
- Deposit: ₹1,20,000
- Tenancy: 2024-03-01 to 2025-08-01
- Situation: "Partial with vague deductions"
- Days since vacation: 20
- Free text: "Landlord said ₹40,000 for painting and cleaning but no bills shown"

**Expected:**
- `situation_type: 'vague_deductions'`
- Draft cites Maharashtra Rent Control Act (not Karnataka Rent Act)
- Draft argues deductions must be itemized with receipts
- Forum: legal notice + Consumer Commission (Maharashtra)

### TC-C-03 — Landlord unreachable (criminal breach)
**Priority:** P0
**Input:**
- State: Karnataka, City: Bangalore
- Deposit: ₹2,00,000
- Situation: "Landlord unreachable, phone off, no response for 60 days"
- Evidence: rent agreement, bank transfer, WhatsApp

**Expected:**
- `situation_type: 'landlord_unreachable'`
- Primary forum includes police complaint (Sec 406 IPC — criminal breach of trust)
- Draft includes police complaint next-step
- Legal notice draft still generated

### TC-C-04 — Large claim above District Commission limit
**Priority:** P0
**Input:**
- Deposit: ₹80,00,000 (commercial-scale residential, edge case)

**Expected:**
- `primary_forum: 'civil_suit'`
- Draft flags "consult a lawyer" prominently
- Does not attempt full civil suit drafting (out of v1 scope)

### TC-C-05 — State outside v1 corpus
**Priority:** P0
**Input:**
- State: Rajasthan, City: Jaipur

**Expected:**
- Product either:
  (a) generates a Consumer Protection Act-only draft with a clear limitation notice, OR
  (b) refuses with a friendly "we don't yet cover Rajasthan" message and offers Model Tenancy Act as fallback if MTA-adopted
- Never generates a Karnataka Rent Act citation for a Rajasthan case

### TC-C-06 — MTA-adopted state (Andhra Pradesh)
**Priority:** P1
**Input:**
- State: Andhra Pradesh, City: Hyderabad
- Rest same as TC-C-01

**Expected:**
- Draft cites MTA 2021 sections
- Forum: Rent Authority (MTA-created) as primary, Consumer Commission as secondary

### TC-C-07 — Ambiguous situation
**Priority:** P1
**Input:**
- Situation description: "It's complicated, landlord is my uncle"

**Expected:**
- Classification confidence < 0.7
- Product prompts user to elaborate rather than proceeding
- Does not fabricate a classification

---

## Grounding tests (hallucination prevention)

### TC-G-01 — Every citation exists in corpus
**Priority:** P0
**Input:** any complete draft
**Expected:**
- For every citation in the draft, the section number + act name must match a chunk that was retrieved during generation
- Verifier catches and blocks any citation to a section not in retrieved chunks

### TC-G-02 — No citation to sections outside v1 corpus
**Priority:** P0
**Input:** any generated draft
**Expected:**
- No citations to acts or sections not in the whitelisted v1 corpus
- Verifier maintains an allowlist of `{act, section}` tuples

### TC-G-03 — State-appropriate statutes only
**Priority:** P0
**Input:** Karnataka user
**Expected:**
- No citations to Maharashtra Rent Control Act
- No citations to state-specific acts outside the user's state
- Verifier filters by state metadata on chunks

### TC-G-04 — MTA cited only for MTA-adopted states
**Priority:** P0
**Input:** Karnataka user (Karnataka has NOT adopted MTA)
**Expected:**
- Draft may reference MTA 2021 as "model" law but cannot cite it as binding
- Karnataka Rent Act citations are binding, MTA is contextual only

### TC-G-05 — No invented case law
**Priority:** P0
**Input:** any generated draft
**Expected:**
- Draft contains no references to case names or judgment citations
- If a chunk in the corpus references case law, it may be quoted with attribution but not paraphrased freely
- LLM prompt explicitly forbids inventing case law

### TC-G-06 — No invented section numbers
**Priority:** P0
**Input:** any generated draft
**Expected:**
- Every section number cited exists in the actual text of the referenced act
- Automated regex check: extract all "Section N" mentions, verify against corpus

### TC-G-07 — Corpus version recorded
**Priority:** P0
**Input:** any draft generation
**Expected:**
- `DraftResult.corpus_version` is recorded and non-null
- Version format: semver or ISO date

---

## Edge case tests

### TC-E-01 — No written rent agreement
**Priority:** P0
**Input:**
- Evidence: only WhatsApp chats and bank transfer, no rent agreement checkbox

**Expected:**
- Draft still generates
- Includes prominent flag: "Absence of written agreement weakens your case; landlord may deny tenancy"
- Suggests: "Attach WhatsApp chats where landlord acknowledges tenancy or accepts rent"

### TC-E-02 — Deposit less than one month rent (unusual)
**Priority:** P1
**Input:** Rent ₹40,000, deposit ₹15,000

**Expected:**
- Product accepts input, no false-positive validation error
- Draft handles the small claim value routing

### TC-E-03 — Tenancy end date in future
**Priority:** P0
**Input:** Tenancy end date is next month

**Expected:**
- Product refuses gracefully: "You appear to be a current tenant. This tool is for deposit recovery after vacation. Mid-tenancy grievances are not yet supported."
- Does not generate a draft

### TC-E-04 — Hostile free-text input
**Priority:** P0
**Input:** Free text contains slurs, threats, or aggressive language toward landlord

**Expected:**
- Content filter neutralizes tone in generated draft
- Facts are preserved, invective is not
- If input contains threats, product may refuse to draft

### TC-E-05 — Cash deposit, no bank record
**Priority:** P1
**Input:** Evidence: no bank transfer proof checkbox

**Expected:**
- Draft generates
- Flags evidence weakness explicitly
- Suggests: "Attach any receipts, contemporaneous WhatsApp messages, or witness affidavits for the deposit payment"

### TC-E-06 — Very old vacation date
**Priority:** P1
**Input:** Days since vacation > 730 (more than 2 years)

**Expected:**
- Product warns about limitation period (typically 3 years for civil claims under Limitation Act)
- Still generates draft with a "seek legal advice on limitation" flag

### TC-E-07 — Rent paid partially in cash, partially in bank
**Priority:** P2
**Input:** Free text mentions mixed payment

**Expected:**
- Draft acknowledges partial cash payments
- Recommends attaching all available receipts

---

## Refusal tests

### TC-R-01 — Commercial lease
**Priority:** P0
**Input:** Free text mentions "shop," "office," "commercial premises"

**Expected:**
- Product refuses with clear message: "Commercial leases have a different legal framework. Please consult a lawyer."
- Does not generate a draft

### TC-R-02 — Non-tenancy dispute
**Priority:** P0
**Input:** Situation description reveals employment / consumer product / other dispute

**Expected:**
- Refuses with "This tool covers residential tenancy disputes only. For other issues, consult appropriate resources."

### TC-R-03 — "Is this legal advice"
**Priority:** P0
**Input:** User types "Is this legal advice" anywhere or clicks disclaimer

**Expected:**
- Disclaimer text is clearly visible: "This is an informational drafting tool, not legal advice"
- If asked in a free text field, response confirms it is not legal advice

### TC-R-04 — Blank intake
**Priority:** P0
**Input:** All fields empty, user clicks "Draft my notice"

**Expected:**
- Validation errors displayed on each required field
- No API call made
- Clear guidance on which fields must be completed

### TC-R-05 — Attempt to draft for third party
**Priority:** P1
**Input:** Free text: "This is for my friend who..."

**Expected:**
- Product accepts (drafts can be sent on behalf of anyone the user chooses)
- Draft uses first-person for the friend if that's clear from context

---

## UX tests

### TC-U-01 — Full flow on mobile
**Priority:** P0
**Environment:** iOS Safari, Android Chrome, mobile viewport (375-414px width)

**Expected:**
- All screens render without horizontal scroll
- CTAs are thumb-reachable
- Intake form usable one-handed
- Results screen stacks (right panel first) on mobile

### TC-U-02 — Back button preserves state
**Priority:** P0
**Input:** User completes step 3, clicks Back to step 2, then Next

**Expected:**
- Step 2 shows previously entered values
- No data loss

### TC-U-03 — Refresh mid-processing
**Priority:** P1
**Input:** User refreshes page during processing

**Expected:**
- Session ID retrieved from cookie
- Processing state restored, or user is shown "Continue where you left off"
- No re-submission of intake required

### TC-U-04 — PDF download works
**Priority:** P0
**Environment:** Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome

**Expected:**
- PDF downloads with correct filename (e.g., `Legal_Notice_Deposit_2026-07-31.pdf`)
- PDF is well-formatted (not just HTML)
- All text is selectable

### TC-U-05 — Screen reader accessibility
**Priority:** P1
**Environment:** VoiceOver (Mac/iOS), NVDA (Windows)

**Expected:**
- All form fields have labels
- Progress steps announced
- Focus order is logical
- No focus traps

### TC-U-06 — Keyboard-only navigation
**Priority:** P1
**Environment:** Desktop, tab-only navigation

**Expected:**
- Full flow completable with keyboard
- Focus indicators visible
- Modal (edit draft) traps focus correctly

### TC-U-07 — Slow network
**Priority:** P1
**Environment:** Simulated 3G

**Expected:**
- Landing loads within reasonable time
- Processing screen keeps user informed if delayed
- Timeout handling with clear retry option

---

## Performance tests

### TC-P-01 — p95 draft time under 90s
**Priority:** P0
**Method:** 100 runs of TC-C-01

**Expected:**
- p95 time from intake submit to draft rendered ≤ 90 seconds
- p50 ≤ 45 seconds

### TC-P-02 — Vector retrieval latency
**Priority:** P1
**Method:** 100 retrieval queries against corpus

**Expected:**
- p95 retrieval latency ≤ 500ms
- Top-5 retrieval consistent (deterministic for same query)

### TC-P-03 — Corpus loads at startup
**Priority:** P1
**Method:** Cold start on Vercel

**Expected:**
- First user does not hit corpus cold-start latency
- Corpus indexed at build time or loaded at server initialization

### TC-P-04 — Landing LCP
**Priority:** P1
**Method:** Lighthouse mobile

**Expected:**
- Largest Contentful Paint < 2.0s on 4G
- CLS < 0.1

---

## Security tests

### TC-S-01 — Rate limiting per IP
**Priority:** P0
**Input:** 11+ draft generation requests from same IP in 24 hours

**Expected:**
- 11th request onwards returns 429 Too Many Requests
- Clear error message to user

### TC-S-02 — Session isolation
**Priority:** P0
**Input:** Two concurrent users on same server

**Expected:**
- Each user sees only their own session
- Session ID not guessable

### TC-S-03 — No PII in logs
**Priority:** P0
**Method:** Audit logs after test runs

**Expected:**
- No names, addresses, phone numbers in server logs
- Landlord names entered only client-side, not sent to server
- OR if server processes them, they are redacted in logs

### TC-S-04 — XSS in intake fields
**Priority:** P0
**Input:** Free text field contains `<script>alert(1)</script>`

**Expected:**
- Content is escaped in both intake echo and generated draft
- No script execution

### TC-S-05 — SSRF resistance
**Priority:** P1
**Input:** User attempts to inject URL in intake

**Expected:**
- No outbound requests triggered by user input
- If external calls needed (e.g., GSTIN verification for a future feature), inputs are strictly validated

---

## Content quality tests

### TC-Q-01 — Draft tone is formal and non-inflammatory
**Priority:** P0
**Method:** Manual review of 10 generated drafts

**Expected:**
- Language is legally formal
- No accusatory or emotional language
- No first-person hostile framing

### TC-Q-02 — Draft length is reasonable
**Priority:** P1
**Method:** Draft length across test cases

**Expected:**
- 400-1000 words typical
- Never longer than 2000 words
- Never shorter than 300 words

### TC-Q-03 — Citations are contextually relevant
**Priority:** P0
**Method:** Manual review of 20 drafts

**Expected:**
- Every citation supports a specific argument in the draft
- No citations are decorative or filler

### TC-Q-04 — No "AI voice" tics
**Priority:** P1
**Method:** Manual review

**Expected:**
- No "It's important to note that..."
- No "In conclusion..."
- No em-dash overuse
- No unnecessary hedging

---

## Regression tests (before every deploy)

Full suite of P0 tests must pass in CI before merging to main.

Recommended: automate TC-G-01 through TC-G-07 as unit tests since they are deterministic.

TC-C-01, TC-C-02, TC-C-03 should have integration tests with mocked LLM responses.

TC-U-* tests done manually against a preview URL before promoting to production.

---

**End of test cases.**
