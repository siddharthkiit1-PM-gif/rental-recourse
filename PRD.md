# Rental Recourse — v1 PRD

**Product codename:** Recourse (working name; change on brand)
**Owner:** Siddharth Wadhwani
**Target ship date:** 7 days from build start
**Status:** Draft for engineering handoff (Claude Code)

---

## 1. Problem statement

Urban Indian renters routinely lose ₹50,000 to ₹3,00,000 in security deposits when landlords refuse to refund after vacation, invent damage charges, or simply stop responding. Karnataka Rent Act, Model Tenancy Act 2021, and Consumer Protection Act 2019 give tenants real legal remedies (Rent Court, Consumer Commission, civil suit, and in clear scams, a police complaint for criminal breach of trust). But 95% of cases die between "I have a valid claim" and "I filed the right instrument at the right forum," because tenants don't know which lever to pull, what to write, or what evidence to attach. Existing legal-tech in India (LegalKart, Vakilsearch, LawRato) charges ₹2,000-15,000 to draft what is essentially a templated legal notice; free government portals (e-Daakhil, e-Jagriti) have no drafting help and assume the user knows the correct forum.

**Cost of not solving:** Individual tenants absorb the loss and share horror stories on Reddit. Systemic tenant exploitation continues because the friction of recourse exceeds the value of the deposit for most people.

## 2. Users and personas

### Primary persona — Ravi, the recent vacater

- 26-35, works in tech/marketing/consulting, urban metro (Bangalore, Mumbai, Pune, Delhi NCR, Hyderabad)
- Rented a 1BHK or 2BHK at ₹25,000-60,000/month, paid ₹75,000 to ₹3,00,000 deposit
- Vacated 30-90 days ago with proper notice
- Landlord is either non-responsive, deducting vague amounts, or partially refunding without justification
- Comfortable with English, tech-native, has WhatsApp screenshots and bank transaction proof
- Emotional state: angry, embarrassed, cash-constrained, running out of patience
- Willingness to spend time: high (~30-60 minutes if the product actually helps)
- Willingness to pay: low for v1 (product should be free); would pay ₹200-500 for full filing help in v2

### Secondary persona — Priya, mid-tenancy tenant with unfair deductions notice

- Received a message from landlord about pre-emptive deductions before vacation
- Wants to know what she can legally push back on
- Same demographic band as Ravi
- Uses the product proactively before vacating

### Non-user

- Landlords. Not a market to serve here. Product positions clearly on the tenant side.
- Commercial lease disputes. Different legal framework, higher stakes, requires a lawyer.
- Rural / non-metro tenants. State-specific rent acts vary too much to cover in v1.

## 3. Goals

Outcome-oriented, measurable at 30 days post-launch:

1. **Draft-completion rate ≥ 60%** — of users who start intake, ≥60% receive a downloadable legal notice PDF. Measures whether the flow is completable.
2. **Citation grounding accuracy ≥ 98%** — every statute citation in generated drafts must match the retrieved chunk exactly. Measured by automated verifier on all generated outputs.
3. **User-reported perceived usefulness ≥ 4/5** — post-download in-product NPS-style prompt. Success threshold: 4/5 average across ≥30 responses.
4. **Time-to-draft ≤ 90 seconds** — from intake submission to draft rendered. Measured p95 across users.
5. **First-week distribution: 100 completed drafts.** Success indicator for organic traction after Reddit + Twitter launch.

## 4. Non-goals for v1

1. **Filing at the actual forum.** Product outputs a filing-ready draft and a step-by-step checklist for e-Jagriti / e-Daakhil / Rent Court, but does not submit on the user's behalf. Rationale: government portal integration requires empanelment and months of compliance work.

2. **Multi-vertical grievance types.** No employment, telecom, banking, e-commerce, or medical negligence in v1. Rationale: each vertical is its own corpus and instrument set; scope-controllable only by narrowing.

3. **Pre-signing agreement review (Mode 1).** No PDF upload of rental agreements to flag unfair clauses. Rationale: different UX, different value moment. Ship as separate mode in v2.

4. **Mid-tenancy grievances (Mode 3).** No rent hike disputes, repair issues, illegal entry, or notice-period violations. Rationale: same as above.

5. **All Indian states.** v1 covers Karnataka, Maharashtra, and states that have adopted the Model Tenancy Act 2021 (Andhra Pradesh, UP, Assam, Tamil Nadu partial). Rationale: statute corpus and forum routing complexity multiplies per state.

6. **Multi-language.** English only for v1. Rationale: legal notices in India are conventionally in English; regional language support is a post-launch enhancement.

7. **User accounts, saved drafts, revision history.** No auth in v1. Session-only. Rationale: zero-setup is a core value proposition. Adding auth here creates friction that kills conversion at exactly the wrong moment.

8. **Payments.** Product is free in v1. Rationale: no monetization until product-market signal is clear; also no payments = no compliance overhead.

## 5. Product overview

Recourse is a web app that takes a tenant's deposit-recovery situation as structured input, runs an agentic loop to classify the grievance, route to the correct forum, generate an evidence checklist, and draft a legally-grounded pre-litigation notice. Every generated draft is grounded in a retrieved statute corpus (Karnataka Rent Act, MTA 2021, CPA 2019, Section 74 of the Indian Contract Act) with citations that can be traced back to actual section text.

### The agent loop (four ordered decisions)

1. **Classify situation** — non-return / unfair-deduction / partial-refund-with-delay / partial-refund-with-vague-damages / criminal-breach-suspected. Uses LLM with structured output.

2. **Route to forum** — Rent Authority (states with MTA) vs District Consumer Commission (deficiency of service under CPA 2019) vs civil suit (for larger sums) vs pre-litigation legal notice (mandatory step before Consumer Commission). Uses rule-based routing informed by claim value, state, and evidence available.

3. **Generate evidence checklist** — template selected by forum + LLM personalization based on stated evidence. Explicit list of what user needs to attach.

4. **Draft the instrument** — Retrieval-augmented drafting. RAG retrieves relevant sections; LLM drafts the notice; verifier confirms every citation is grounded.

## 6. User stories

Ordered by priority.

### P0 stories

**US-1** — As a tenant whose landlord has not returned the deposit, I want to describe my situation in plain English so that the tool understands what happened without me needing to know legal terminology.

**US-2** — As a tenant, I want to see which forum is the right place to file so that I don't waste time filing at the wrong one.

**US-3** — As a tenant, I want a legal notice drafted that I can send to my landlord via registered post, so that I have a formal pre-litigation step done.

**US-4** — As a tenant, I want every legal claim in my draft grounded in an actual section of law so that if my landlord's lawyer challenges me, my position holds up.

**US-5** — As a tenant, I want to download the notice as a PDF so that I can print, sign, and dispatch.

**US-6** — As a tenant, I want a clear next-steps checklist (how to send the notice, where to file if the landlord ignores it, what evidence to gather) so that I know what to do after downloading.

### P1 stories

**US-7** — As a tenant, I want to review and edit the drafted notice before downloading so that I can add personal facts the tool didn't capture.

**US-8** — As a tenant, I want to see the specific sections of law cited alongside the draft so that I can verify the legal basis.

**US-9** — As a tenant not sure if my situation applies, I want the tool to tell me clearly when my case is outside its scope so that I don't get a bad draft.

### Edge case stories

**US-10** — As a tenant with incomplete information (no written rent agreement, or missing bank transaction records), I want the tool to still help me draft something reasonable while flagging what will weaken my case.

**US-11** — As a tenant whose landlord is threatening back, I want to see clear next steps for escalation to police (criminal breach of trust) if applicable.

## 7. Screens and flow

Five screens. Linear flow with optional review step.

### Screen 1 — Landing

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Recourse                              About  Not legal advice   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│                                                                  │
│      Landlord not returning your deposit?                        │
│                                                                  │
│      Free tool that drafts a legal notice grounded in            │
│      the Karnataka Rent Act, Model Tenancy Act, and              │
│      Consumer Protection Act. Takes ~5 minutes.                  │
│                                                                  │
│      ┌──────────────────────────┐                                │
│      │   Get my notice drafted →│                                │
│      └──────────────────────────┘                                │
│                                                                  │
│      No signup. No payment. Session only.                        │
│                                                                  │
│                                                                  │
│      ────────────────────────────────────                        │
│                                                                  │
│      How it works                                                │
│                                                                  │
│      1. Describe what happened (5 min)                           │
│      2. We classify your situation and pick the right forum      │
│      3. We draft your legal notice grounded in statute           │
│      4. Download PDF, send via registered post                   │
│                                                                  │
│      This is an informational drafting tool. Not legal advice.   │
│      For complex cases, consult a lawyer.                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Above-the-fold value prop legible in 3 seconds
- Single CTA. No secondary distractions
- Trust signals: no signup, no payment, session-only
- Legal disclaimer visible without scroll
- Mobile-responsive; CTA is thumb-reachable

### Screen 2 — Intake

Multi-step form. Six steps, one field-group per step. Progress indicator top.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Recourse                                       Step 2 of 6      │
│  ● ● ○ ○ ○ ○                                                     │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│      Where was the property?                                     │
│                                                                  │
│      State                                                       │
│      ┌──────────────────────────┐                                │
│      │  Karnataka          ▼    │                                │
│      └──────────────────────────┘                                │
│                                                                  │
│      City                                                        │
│      ┌──────────────────────────┐                                │
│      │  Bangalore               │                                │
│      └──────────────────────────┘                                │
│                                                                  │
│                                                                  │
│      ← Back                                     Next →           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Intake steps:**

1. **State + city** (routes correctly to state-specific rent act)
2. **Rent + deposit paid + tenancy dates**
3. **What happened** (dropdown: not returned / partial with vague deductions / partial with itemized but disputed / landlord unreachable / landlord counter-claiming damages)
4. **Days since vacation + last communication with landlord**
5. **Evidence available** (checkboxes: written rent agreement, deposit bank transfer proof, WhatsApp/email communication, joint inspection report, photos/videos of move-out condition, rent receipts)
6. **Anything else in your own words** (free text, max 500 chars, optional)

**Requirements:**
- One question per step to reduce cognitive load
- Back button on every step preserves prior answers
- Client-side validation: required fields, sensible ranges (rent > 0, deposit > 0, tenancy dates plausible)
- No email or phone collection in v1
- Final step: single "Draft my notice" button

### Screen 3 — Processing

Streaming state showing agent's decisions in real time.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Recourse                                                        │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│      Working on your notice...                                   │
│                                                                  │
│      ● Classifying your situation                                │
│        → Non-return with vague deductions                        │
│                                                                  │
│      ● Selecting the right forum                                 │
│        → Legal notice + Consumer Commission (deficiency          │
│          of service under CPA 2019, Section 2(11))               │
│                                                                  │
│      ○ Retrieving relevant law...                                │
│                                                                  │
│      ○ Drafting your notice...                                   │
│                                                                  │
│      ○ Verifying citations...                                    │
│                                                                  │
│                                                                  │
│      This usually takes 30-60 seconds.                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Each step marks itself complete as the agent progresses
- Streaming reduces perceived latency; user sees progress in real time
- Fallback: if any step fails, show friendly error with retry
- Max time budget: 90s. Timeout with user-facing "Something took too long, tap to retry"

### Screen 4 — Results (single page)

Two columns. Left: what we figured out. Right: draft preview.

```
┌──────────────────────────────────────────────────────────────────┐
│  Recourse                                          Download PDF  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  ┌────────────────────────┐  ┌─────────────────────────────────┐ │
│  │  Your situation        │  │  LEGAL NOTICE                   │ │
│  │                        │  │                                 │ │
│  │  Non-return with vague │  │  Under Section 80 of the Code   │ │
│  │  deductions            │  │  of Civil Procedure...          │ │
│  │                        │  │                                 │ │
│  │  Where to file         │  │  From: [Your name]              │ │
│  │  Consumer Commission,  │  │  To: [Landlord name]            │ │
│  │  Bangalore Urban       │  │                                 │ │
│  │  (claim value ₹95,000  │  │  Subject: Notice for return of  │ │
│  │  under ₹50L limit)     │  │  security deposit of ₹95,000    │ │
│  │                        │  │                                 │ │
│  │  Legal basis           │  │  Sir/Madam,                     │ │
│  │  • CPA 2019, Sec 2(11) │  │                                 │ │
│  │    (deficiency of svc) │  │  1. That my client took the     │ │
│  │  • Karnataka Rent Act, │  │  premises on rent from...       │ │
│  │    Sec 12 (deposit     │  │                                 │ │
│  │    refund timeline)    │  │  2. That under Section 12 of    │ │
│  │  • MTA 2021, Sec 11    │  │  the Karnataka Rent Act, the    │ │
│  │    (deposit cap)       │  │  landlord is required to...     │ │
│  │                        │  │                                 │ │
│  │  Evidence to attach    │  │  [More content...]              │ │
│  │  ☑ Rent agreement      │  │                                 │ │
│  │  ☑ Bank transfer proof │  │  ┌───────────────────────────┐  │ │
│  │  ☑ WhatsApp chats      │  │  │  Edit draft               │  │ │
│  │  ☐ Move-out photos     │  │  └───────────────────────────┘  │ │
│  │    (recommended)       │  │                                 │ │
│  │                        │  │                                 │ │
│  │  Next steps            │  │                                 │ │
│  │  1. Send by regd post  │  │                                 │ │
│  │  2. Wait 15 days       │  │                                 │ │
│  │  3. File at Consumer   │  │                                 │ │
│  │     Commission via     │  │                                 │ │
│  │     e-Jagriti          │  │                                 │ │
│  │                        │  │                                 │ │
│  └────────────────────────┘  └─────────────────────────────────┘ │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Left panel: classification, forum, legal basis (with hover-to-see-section-text), evidence checklist, next steps
- Right panel: full draft with inline citation highlights
- Prominent Download PDF button in header
- Edit draft button opens Screen 5
- Mobile: stacked, right panel first

### Screen 5 — Edit draft (optional)

Simple textarea with the draft. User can add personal facts, correct auto-filled fields, or adjust tone.

```
┌──────────────────────────────────────────────────────────────────┐
│  Recourse                                    Save and download   │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  LEGAL NOTICE                                            │    │
│  │                                                          │    │
│  │  Under Section 80 of the Code of Civil Procedure...      │    │
│  │                                                          │    │
│  │  From: [Your name]                                       │    │
│  │  To: [Landlord name]                                     │    │
│  │                                                          │    │
│  │  [User can edit any part of this text directly]          │    │
│  │                                                          │    │
│  │                                                          │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ← Back to results                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Single textarea, monospace or serif font for legal-document feel
- Save preserves edits and returns to Results screen
- No autosave — user explicitly saves
- Character limit: 20,000

### Screen 6 — Post-download

Confirmation + share prompt + feedback ask.

```
┌──────────────────────────────────────────────────────────────────┐
│  Recourse                                                        │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│      ✓ Downloaded                                                │
│                                                                  │
│      Your notice is ready.                                       │
│                                                                  │
│      Next steps:                                                 │
│                                                                  │
│      1. Print, sign, and send to your landlord via               │
│         registered post (Speed Post also acceptable)             │
│      2. Keep the tracking receipt as proof of dispatch           │
│      3. Wait 15 days for a response                              │
│      4. If ignored, file at Consumer Commission via              │
│         e-Jagriti (link below)                                   │
│                                                                  │
│      → How to file at e-Jagriti (opens in new tab)               │
│                                                                  │
│      ────────────────────────────────────                        │
│                                                                  │
│      Was this useful?                                            │
│                                                                  │
│      ⭐ ⭐ ⭐ ⭐ ⭐                                                │
│                                                                  │
│      Tell one friend who's had this problem →                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Clear next steps
- Feedback capture (5-star click, no signup needed, stored anonymously)
- Share prompt with pre-filled tweet + WhatsApp message

## 8. Technical architecture

### Stack (matches Siddharth's existing preferences)

- **Frontend:** Next.js App Router (14+), React, TypeScript, Tailwind
- **AI:** Gemini 2.5 Pro via `@google/genai` SDK, Vercel AI SDK v6 for streaming
- **Vector store:** Upstash Vector (compatible with existing Upstash Redis usage)
- **Storage:** No persistent user data in v1. Session state in cookies + Upstash Redis with 24hr TTL for anonymous analytics only
- **PDF generation:** `react-pdf` or `pdf-lib` — server-side render to keep client bundle lean
- **Hosting:** Vercel
- **Analytics:** Vercel Analytics (built-in, GDPR-friendly)

### High-level architecture

```
[Browser]
   ↓ POST /api/agent/start (intake payload)
[Next.js API route]
   ↓
[Agent orchestrator (Vercel AI SDK)]
   ↓
   ├─→ [classify_situation] LLM structured output
   ├─→ [select_forum]       rule-based + LLM verify
   ├─→ [retrieve_statute]   Upstash Vector query
   ├─→ [generate_checklist] LLM
   ├─→ [draft_instrument]   LLM with RAG context
   └─→ [verify_citations]   deterministic check
   ↓
[Stream response to browser]
   ↓
[Browser renders results, allows edit, downloads PDF]
```

### RAG corpus

**Sources (v1 corpus):**

1. **Karnataka Rent Act, 2001** — Sections 9, 12, 27, 30, 34 (deposit, refund, tribunal jurisdiction)
2. **Model Tenancy Act, 2021** — Sections 11, 12, 21, 32 (deposit cap at 2 months residential, refund timeline, Rent Authority, Rent Court)
3. **Maharashtra Rent Control Act, 1999** — for Mumbai/Pune users
4. **Consumer Protection Act, 2019** — Sections 2(7), 2(11), 2(42), 35, 38 (consumer definition, deficiency of service, complaint procedure, District Commission jurisdiction)
5. **Indian Contract Act, 1872** — Section 74 (penalty clause challenge, useful for lock-in deposit forfeiture arguments)
6. **Code of Civil Procedure, 1908** — Section 80 (legal notice format for suits against government/parties, framing basis)

**Chunking strategy:**
- Chunk at the section level (not sub-section)
- Each chunk carries metadata: `act_name`, `section_number`, `state` (if applicable), `subject_tags` (deposit, notice, forum, jurisdiction, timeline, penalty)
- Embedding model: Gemini `text-embedding-004` (1536 dim)
- Retrieval: top-k=5 with subject_tag filter based on agent's current step

**Corpus preparation:**
- Statute texts sourced from official government portals (india.gov.in, indiacode.nic.in)
- Manually verified for accuracy against Bare Acts before ingestion
- Corpus versioned; every draft records `corpus_version` used

### Agent state machine

State transitions and tool contracts.

**Tool 1: `classify_situation`**
- Input: full intake payload
- Output: `{ situation_type: enum, confidence: float, claim_value_inr: number, reasoning: string }`
- LLM: Gemini 2.5 Pro with structured output schema
- Fallback: if confidence < 0.7, return `ambiguous` and prompt user to elaborate

**Tool 2: `select_forum`**
- Input: `{ situation_type, claim_value_inr, state, evidence_available }`
- Output: `{ primary_forum: enum, secondary_forum: enum|null, reasoning: string, filing_url: string|null }`
- Logic: mostly rule-based (see forum routing matrix below); LLM used to double-check reasoning
- Fallback: if state not in v1 scope, default to `consumer_commission` and flag limitation to user

**Tool 3: `retrieve_statute`**
- Input: `{ query: string, jurisdiction: state, subject_tags: string[] }`
- Output: `{ chunks: [{ act, section, text, url }] }`
- Implementation: Upstash Vector query with metadata filter
- Returns top-5 chunks

**Tool 4: `generate_evidence_checklist`**
- Input: `{ forum, situation_type, evidence_available }`
- Output: `{ required: string[], recommended: string[], missing_flags: string[] }`
- LLM with template + evidence checklist per forum

**Tool 5: `draft_instrument`**
- Input: full context + retrieved chunks
- Output: `{ draft_text: string, citations: [{ act, section, span_in_draft }] }`
- LLM with strict instruction to only cite provided chunks

**Tool 6: `verify_citations`**
- Input: `{ draft_text, citations, retrieved_chunks }`
- Output: `{ all_verified: bool, unverified: [{ citation, reason }] }`
- Deterministic check: for each citation, confirm the section number and act name match a retrieved chunk
- If any citation fails, block output and regenerate

### Forum routing matrix

Decision table for `select_forum`:

| Situation | Claim value | State | Primary forum | Also draft |
|-----------|-------------|-------|--------------|-----------|
| Non-return | Any | KA/MH/MTA states | Legal notice | Then Consumer Commission via e-Jagriti |
| Vague deductions | Any | KA/MH/MTA states | Legal notice | Then Consumer Commission |
| Landlord unreachable | > ₹50,000 | Any | Legal notice + police complaint (criminal breach of trust, Sec 406 IPC) | — |
| Partial refund with itemized damages disputed | Any | Any | Legal notice | Then civil suit if amount > ₹5L |
| Any | > ₹50L | Any | Civil suit (High Court) | Consultation recommended |

## 9. Data models

Session (in Upstash Redis, 24hr TTL, anonymous):

```typescript
type Session = {
  session_id: string; // UUID
  created_at: number;
  intake: IntakePayload;
  classification: ClassificationResult | null;
  forum: ForumResult | null;
  evidence_checklist: EvidenceChecklist | null;
  draft: DraftResult | null;
  edited_draft: string | null;
  feedback: { rating: 1|2|3|4|5, timestamp: number } | null;
};

type IntakePayload = {
  state: string;
  city: string;
  monthly_rent_inr: number;
  deposit_paid_inr: number;
  tenancy_start: string; // ISO date
  tenancy_end: string;   // ISO date
  situation_type_user_selected: string;
  days_since_vacation: number;
  last_communication_date: string | null;
  evidence_available: string[];
  free_text_context: string | null;
};

type ClassificationResult = {
  situation_type: 'non_return' | 'vague_deductions' | 'partial_delay' | 'landlord_unreachable' | 'itemized_disputed' | 'ambiguous';
  confidence: number;
  claim_value_inr: number;
  reasoning: string;
};

type ForumResult = {
  primary_forum: 'legal_notice' | 'consumer_commission' | 'rent_authority' | 'rent_court' | 'civil_suit' | 'police_complaint';
  secondary_forum: string | null;
  jurisdiction: string;
  filing_url: string | null;
  reasoning: string;
};

type DraftResult = {
  draft_text: string;
  citations: Array<{
    act: string;
    section: string;
    span_start: number;
    span_end: number;
    chunk_id: string;
  }>;
  corpus_version: string;
  generated_at: number;
  verified: boolean;
};
```

## 10. API contracts

**POST /api/agent/start**
- Body: `IntakePayload`
- Response: SSE stream of agent events
- Event types: `classified`, `routed`, `retrieved`, `checklist_ready`, `drafting`, `verified`, `complete`, `error`

**POST /api/draft/edit**
- Body: `{ session_id, edited_draft: string }`
- Response: `{ ok: true }`

**POST /api/draft/download**
- Body: `{ session_id }`
- Response: PDF binary

**POST /api/feedback**
- Body: `{ session_id, rating: 1-5 }`
- Response: `{ ok: true }`

## 11. Test cases

Grouped by concern. See `TEST_CASES.md` for the full suite. Summary here:

### Correctness tests (must pass before ship)

- **TC-C-01:** Non-return in Bangalore, ₹95k deposit, all evidence — draft routes to legal notice + Consumer Commission
- **TC-C-02:** Vague deductions in Mumbai, ₹1.2L deposit — routes to legal notice + Consumer Commission (Maharashtra)
- **TC-C-03:** Landlord unreachable, ₹2L deposit — routes to police complaint (Sec 406 IPC) + legal notice
- **TC-C-04:** Claim value ₹80L — routes to civil suit, flags user to consult lawyer
- **TC-C-05:** State outside v1 scope (Rajasthan) — routes to Consumer Commission with limitation flag

### Grounding tests (must pass on every generated output)

- **TC-G-01:** Every citation's section number exists in retrieved corpus
- **TC-G-02:** No citation to sections not in v1 corpus
- **TC-G-03:** Sections cited match the state's applicable act (Karnataka Rent Act for KA users, not Maharashtra)
- **TC-G-04:** MTA 2021 cited only for MTA-adopted states
- **TC-G-05:** Draft does not invent case law or judgment references

### Edge case tests

- **TC-E-01:** Missing rent agreement — draft still generates, flags weakness
- **TC-E-02:** Deposit < 1 month rent (unusual) — draft accepts, no false flag
- **TC-E-03:** Tenancy end date in future (still tenant) — routes to mid-tenancy notice (v2 scope, refuses with clear message)
- **TC-E-04:** Free text with slur or hostile language — draft neutralizes tone, keeps facts
- **TC-E-05:** Deposit paid via cash (no bank record) — draft accepts, flags evidence weakness

### Refusal tests

- **TC-R-01:** User describes commercial lease — refuses, points to consulting a lawyer
- **TC-R-02:** User describes non-tenancy dispute — refuses, out of scope message
- **TC-R-03:** User asks "is this legal advice" — clear disclaimer, no advice given
- **TC-R-04:** User submits blank intake — validation error, clear next step

### UX tests

- **TC-U-01:** Full flow on mobile (Chrome, iOS Safari, Android)
- **TC-U-02:** Back button preserves state at every intake step
- **TC-U-03:** Refresh mid-processing recovers session
- **TC-U-04:** Draft download works on all target browsers
- **TC-U-05:** Screen reader accessibility for intake form (labels, aria)

### Performance tests

- **TC-P-01:** p95 time from intake submit to draft render < 90s
- **TC-P-02:** Vector retrieval p95 < 500ms
- **TC-P-03:** Full corpus loads in memory at startup (no cold-start hit on first user)

## 12. Non-functional requirements

- **Accessibility:** WCAG 2.1 AA. Semantic HTML, labels, keyboard-navigable
- **Performance:** Landing page LCP < 2s on 4G. Interactive within 1s
- **Privacy:** No PII stored beyond session TTL (24hr). No user account. Session-only. Free-text field explicitly warns against including personal identifiers of the landlord in the intake (only in the final downloaded draft, client-side)
- **Legal positioning:** Every screen carries "Informational drafting tool, not legal advice" microcopy. Footer has full disclaimer. No use of terms "lawyer," "legal advice," "legal counsel," "attorney"
- **Content safety:** LLM outputs pass through a filter for defamatory language before rendering
- **Rate limiting:** 10 draft generations per IP per day (protects against abuse and cost overrun)

## 13. Out of scope for v1 (already listed but restated for scope discipline)

- Mode 1: Pre-signing agreement review
- Mode 3: Mid-tenancy grievance drafting
- Multi-language
- User accounts and saved drafts
- Filing on user's behalf
- Payments
- States outside KA/MH/MTA-adopted
- Employment, telecom, banking, e-commerce, medical grievances

## 14. Risks and mitigations

**Risk R-1: Legal risk from being read as unauthorized practice of law.**
- Mitigation: strict language ("drafting tool," "informational," never "advice"). Disclaimer on every screen. Consult a lawyer before launch to review positioning. Reference: DoNotPay case study.

**Risk R-2: Citation hallucination causing user to file with wrong section reference.**
- Mitigation: mandatory verifier step. Block output on any unverified citation. Regenerate up to 3 times, then fail gracefully with "Try again."

**Risk R-3: Retention paradox — users need this once every 2-3 years, so retention is inherently low.**
- Mitigation: designed as a one-shot utility, not a product with retention. Success metric is completion rate + shares, not DAU/WAU.

**Risk R-4: State-specific corpus errors — statute drift, amendment miss.**
- Mitigation: corpus versioned. Manual review before every corpus update. `corpus_version` recorded on every draft for auditability.

**Risk R-5: Landlord counter-action after tenant sends drafted notice.**
- Mitigation: not our problem to solve, but disclaimer includes "if you receive a legal response, consult a lawyer."

## 15. 7-day build sequence

**Day 1 — Corpus and RAG setup**
- Ingest 6 acts into Upstash Vector with section-level chunks + metadata
- Verify retrieval accuracy on 10 test queries
- Build `retrieve_statute` tool

**Day 2 — Classification and routing**
- `classify_situation` with Gemini structured output
- `select_forum` with rule table + LLM verifier
- Unit tests for both against TC-C-01 through TC-C-05

**Day 3 — Drafting and verification**
- `draft_instrument` with RAG context
- `verify_citations` deterministic check
- Regeneration loop on failed verification
- Tests against TC-G-01 through TC-G-05

**Day 4 — Frontend intake + processing UX**
- Next.js App Router setup
- Intake multi-step form (Screen 2)
- Streaming processing UI (Screen 3)

**Day 5 — Results, edit, download**
- Results page (Screen 4)
- Edit textarea (Screen 5)
- PDF generation and download

**Day 6 — Polish and edge cases**
- Refusal cases (TC-R-01 through TC-R-04)
- Mobile responsiveness
- Accessibility pass
- Error states and retries

**Day 7 — Landing, launch prep, Loom video**
- Landing page (Screen 1)
- Post-download screen (Screen 6)
- Copy pass (all microcopy legal-safe)
- Loom video of full flow on a real-ish case
- Reddit thread draft, Twitter launch thread draft

## 16. Open questions

- **OQ-1 (Legal):** Should the disclaimer include a clickable "consult a lawyer" link with a list of pro bono / low-cost tenant rights organizations? Non-blocking; can add post-launch.
- **OQ-2 (Product):** Should users be able to save their draft to a shareable URL without an account? Adds one line of complexity but enables sharing with a lawyer. Deferred — decide day 5.
- **OQ-3 (Data):** Log intake payloads (anonymized) for corpus improvement? Requires clear consent copy. Deferred to v2.
- **OQ-4 (Distribution):** Should the Reddit launch thread be posted by Siddharth's account or by an anonymous account? Personal branding vs. potential astroturfing perception. Decide before launch.

## 17. Claude Code handoff notes

When passing this PRD to Claude Code, mention:

1. Stack: Next.js App Router, TypeScript, Tailwind, Gemini 2.5 Pro via `@google/genai`, Vercel AI SDK v6, Upstash Vector, Upstash Redis, Vercel hosting
2. Start with the RAG corpus (day 1). Everything downstream depends on it. Do not skip the manual verification step
3. Every LLM call that generates user-facing legal text MUST pass through `verify_citations`. Non-negotiable
4. Never let the model output the words "legal advice," "lawyer," "attorney," or "counsel" — enforce this at the prompt level and with a post-generation filter
5. Statute corpus must be checked into the repo (not fetched at runtime) so the app is deterministic and auditable
6. Do not add auth, payments, or user accounts. Session-only via Redis
7. Use Vercel AI SDK's streaming primitives for the processing screen. Do not implement custom SSE
8. Reference `TEST_CASES.md` for the full test suite. All P0 tests must pass before ship

---

**End of PRD.**
