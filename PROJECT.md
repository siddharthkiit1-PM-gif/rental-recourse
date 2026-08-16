# Rental Recourse — Project Brief

> **Purpose of this doc:** A single source of truth for what this product is, what state it's in, what we know, what we don't, and what to figure out next. Read this before making strategic decisions or asking Claude for help on strategy work. Updated **2026-08-17**.

---

## 1. TL;DR

**What:** An AI legal assistant for Indian tenants. Enter your rental situation → get a filing-ready legal notice or forum recommendation, grounded in verbatim state-law citations, in ~30 seconds. Free.

**Who:** Indian renters with security-deposit disputes, non-refunds, illegal eviction threats, or landlord-communication breakdowns. Multi-jurisdictional (6 state acts + CPC + Consumer Protection Act).

**Where:** [rental-recourse.vercel.app](https://rental-recourse.vercel.app). Solo-built. Launched 2026-08-10.

**Stage:** Live, ~630 draft attempts to date, one 500-attempt viral spike on Aug 11, sharp decay since. No monetization. No confirmed retention or completion data yet (counter instrumentation deployed 2026-08-16).

**The one strategic question:** *What triggered Aug 11's spike, and how do we build a channel that reliably produces that kind of day?*

---

## 2. The Product

### User journey (5 steps, ~2 minutes)
1. **Landing** → problem statement + trust cues
2. **Intake** — 6-step form: situation, tenant, landlord, property, evidence, jurisdiction
3. **Processing** — live agent stream: classify → route → retrieve → verify → draft
4. **Result** — legal notice draft, forum recommendation (police / RERA / consumer commission / rent controller / civil suit / legal notice), evidence checklist
5. **Edit + Download** — inline edit, PDF export, rate 1–5★

### Coverage today
- **State rent acts (6):** Karnataka, Delhi, Tamil Nadu, Telangana, West Bengal, Rajasthan
- **National statutes:** Code of Civil Procedure (§80 notice), Consumer Protection Act 2019
- **Situation types:** non_return, landlord_unreachable, illegal_eviction_threat, harassment, forced_lockout, others
- **Forum routing:** deterministic rule matrix (`lib/agent/route.ts`) — no LLM in this decision path
- **Fidelity:** verbatim bare-act text in the corpus, citation verifier rejects hallucinated section numbers
- **Safety:** forbidden-terms filter blocks fabricated attorney claims / promises of outcome

### What it deliberately doesn't do
- No lawyer marketplace / consult booking
- No case filing (users still have to send / file the notice)
- No court-tracking or follow-up
- No payments
- No user accounts (sessions are anonymous, 24h TTL)

---

## 3. Traction (as of 2026-08-17)

### The launch curve
| Day | Attempts | Unique IPs | Note |
|---|---:|---:|---|
| 2026-08-11 | **501** | **383** | Viral spike — source unconfirmed |
| 2026-08-12 | 71 | 55 | −86% |
| 2026-08-13 | 23 | 20 | −68% |
| 2026-08-14 | 13 | 9 | |
| 2026-08-15 | 7 | 4 | |
| 2026-08-16 | 2 | 2 | |
| 2026-08-17 | 0 | 0 | (at time of writing) |

**Source:** Upstash Ratelimit analytics on `/api/agent` (hourly buckets, 90-day retention). Query script: see `lib/admin/metrics.ts::loadMetrics`.

### What we know
- **7 days post-spike:** ~617 attempts, ~473 unique-IP-day records. Approximate unique users is lower (users may return on different days / different IPs).
- **Peak → today decay is ~250×** over 6 days. Steepest drop was Aug 11 → Aug 12.
- **No repeat engagement pattern visible** — daily unique IPs suggests one-and-done use, which for legal tools is often fine (a tenant deals with a dispute once).

### What we don't know
- **Acquisition source of Aug 11.** Likely candidates: HackerNews front page, viral tweet, WhatsApp share, Reddit r/india or r/legaladvice, LinkedIn post. Unconfirmed. **This is the #1 thing to reverse-engineer.**
- **Completion rate.** Counter instrumentation went live 2026-08-16. As of now: 0 completions recorded across all days (because it was deployed after the traffic had already faded).
- **5★ satisfaction / any rating data.** Same — counters started 2026-08-16, no completions yet, so no ratings.
- **Drop-off point in the intake flow.** No analytics on which step users abandon.
- **Geographic distribution.** IPs are not geo-resolved on our side.
- **Device split (mobile vs desktop).** No analytics.

---

## 4. Market

### Sizing (rough, needs verification)
- **India rental households:** ~40M urban (per census 2011 + urbanization trend). Actual current figure needs Niti Aayog / NHB source verification.
- **Deposit-dispute incidence:** commonly cited ~30–50% of tenants report deposit friction. Source: NoBroker/MagicBricks surveys — needs citation.
- **Legal notice price today:** ₹500–2,000 via lawyer; free via NGO but slow (days to weeks); DIY unlikely for non-lawyer tenants.

### Competitive landscape (name specific players)
| Player | What they do | Overlap with us |
|---|---|---|
| **Vakilsearch** | General legal marketplace | Sells legal-notice service ₹1,499+ as one of many products. Not tenant-focused, not AI-drafted. |
| **LegalKart** | Lawyer consult marketplace | Sells 15-min consults ₹499+. Doesn't produce documents directly. |
| **LawRato** | Lawyer directory + basic docs | Free templates (generic), paid drafting via listed lawyers. |
| **NoBroker Pay** | Rent + deposit escrow | Tangential — prevents deposit disputes at source; doesn't help after-the-fact. |
| **NGOs** (e.g. tenant rights forums) | Free advice by volunteers | Slow, informal, no drafted output. |
| **DIY / templates** | Free .doc templates online | Not jurisdiction-aware, no citations, users don't trust them. |

**No direct competitor** doing AI-first, jurisdiction-aware, verbatim-cited legal-notice drafting for Indian tenants (that I've found — worth confirming with your own search).

### Positioning hypotheses (to test)
- **"Free, instant, cite-able legal notice for tenants — no lawyer needed for 90% of deposit cases."**
- **"WhatsApp your rental problem, get a real legal notice you can send."** (channel-first framing)
- **"India's first jurisdiction-aware AI tenant advocate."** (feature-first framing, weaker)

---

## 5. Business Model

### Currently: free, no monetization, no user auth.

### Options to consider (pick one or two to prototype)

| Model | Mechanism | Volume vs margin | Why (or why not) |
|---|---|---|---|
| **Freemium PDF** | Free draft, ₹49–₹99 to download branded PDF | High volume, low margin per convert | Users want a "real" doc to send; PDF w/ letterhead adds perceived legitimacy |
| **Per-notice** | ₹99–₹199 per generated notice, upfront | Low volume, high margin per convert | Kills the "free & instant" hook that likely drove Aug 11 |
| **Lawyer-review add-on** | ₹499–₹999 for lawyer review + signature | Low volume, very high margin | Bridges "AI draft" → "actionable filing"; needs a lawyer supply |
| **Notice-to-post** | ₹199–₹399 to physically send via registered post | Mid volume, mid margin | Solves the last-mile AI can't; real intent-to-pay signal |
| **B2B** | White-label for property mgmt, PG operators, tenant unions | Low volume, high ACV | Slow sales cycle; adjacent revenue but requires outbound |
| **Ads / affiliate** | Route users to lawyer-consult platforms | High volume, low margin | Cheapens brand, no defensibility |

**My default recommendation:** freemium PDF (₹49) + notice-to-post (₹299). PDF captures value from "I want it official"; posting captures value from "I don't know how to send registered post." Both low-friction, both high-perceived-value.

**Do not launch pricing until:** you know completion rate, know what % of completers actually download / share the PDF today, and have run a "willingness to pay" test (soft: post-generation survey; harder: a paywall A/B test).

---

## 6. Tech Stack

Written in TypeScript. Full-stack single deployment. No microservices, no k8s.

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Latest, Turbopack, server components — bleeding-edge; API routes for backend |
| Runtime | Node.js on Vercel Serverless Functions | `/api/agent` runs up to 300s (Fluid Compute) |
| Client | React 19 | With Suspense for streaming agent output |
| AI | **Gemini 2.5 Flash** via `@ai-sdk/google` (not Claude) | Cost, latency, and India-adjacency of Google's models |
| Streaming | Vercel AI SDK v6 (UI messages) | Live step-by-step processing UI |
| RAG store | **Upstash Vector** (dimension: 1536, namespace: v1) | Serverless, cheap, low-ops |
| Embeddings | `gemini-embedding-001` | Same provider as generation |
| KV | **Upstash Redis** | Sessions (24h TTL), rate limits, admin counters (90d TTL) |
| Rate limit | `@upstash/ratelimit` sliding window (30/day/IP) | Free abuse guard; analytics-enabled for our attempt tracking |
| Auth | Custom HMAC cookie + Resend magic link (admin only, no user accounts) | Solo-admin-scale; see `lib/admin/*` |
| Email | Resend (sandbox, `onboarding@resend.dev`) | Currently only sends to owner; needs domain verification to reach anyone else |
| Hosting | Vercel | Auto-deploy on `git push origin main` (currently sometimes shadowed by manual `vercel --prod`; investigate) |
| Repo | github.com/siddharthkiit1-PM-gif/rental-recourse | Public |

### Key architectural decisions
- **Verbatim corpus, not generated summaries.** The bare-act sections are the primary source; the LLM only assembles + drafts. Reduces hallucination risk.
- **Deterministic routing.** `lib/agent/route.ts` is a hard-coded rule matrix, not an LLM decision. Auditability + speed.
- **Two-model strategy.** Gemini 2.5 Flash for latency-critical path; option to swap to a stronger model per step (already scaffolded in `lib/agent/orchestrator.ts`).
- **Session anonymity.** No login, no PII persistence beyond 24h. Reduces compliance surface but limits retention analytics.

---

## 7. Metrics & Instrumentation

### What we track today
| Metric | Source | Retention | Reliability |
|---|---|---|---|
| Draft attempts | Upstash ratelimit analytics | 90 days, hourly buckets | Solid — every `/api/agent` hit |
| Unique IPs / day | Same as above (identifier field) | 90 days | Solid, but IP ≠ user (NAT, mobile carriers) |
| Completions | Durable Redis counter `recourse:counter:draft_completed:<day>` | 90 days | Started 2026-08-16 — no data before |
| Ratings total | Durable Redis counter `recourse:counter:ratings_total:<day>` | 90 days | Started 2026-08-16 |
| 5★ ratings | Durable Redis counter `recourse:counter:rating_5:<day>` | 90 days | Started 2026-08-16 |
| WoW attempts delta | Analytics 14-day query split | Same as above | Solid |

### Instrumentation gaps (worth closing)
- **Funnel step drop-off** — where in intake do users abandon? Need `intake_step_reached:<n>` counter or Vercel Analytics.
- **Time-to-first-token** on the draft — LLM latency perceived-quality signal.
- **Geographic breakdown** — no geo, just IPs. Vercel `req.geo` is available server-side but unused.
- **Device / referrer** — need Vercel Web Analytics or a bare `POST /api/telemetry` beacon.
- **Rating distribution (1–4★, not just 5★)** — cheap to add.
- **Ratings-per-completion** rate — will emerge naturally from counters as data accrues.

### Where to see the numbers
`https://rental-recourse.vercel.app/admin/login` → magic link to `siddharth.kiit1@gmail.com` (Resend sandbox constraint — verify a domain to change this).

---

## 8. Strategic Questions to Research

Ordered by leverage on next 30 days:

### Highest leverage (do first)
1. **Acquisition mystery: what caused Aug 11?** Check Twitter analytics, HN, Reddit, WhatsApp shares, Google Search Console. If you can reproduce that channel, you have a business. If not, everything else is premature.
2. **Willingness to pay:** post a soft signal on the results page — "would you pay ₹X for a signed PDF / posted notice?" Any survey response volume tells you conversion floor.
3. **Real user interviews (5):** anyone who filled the form. WhatsApp DM 5 users, offer 30 min, ask *what they actually did after downloading the draft*. Did they send it? Did it work? What was missing?

### Mid leverage (within 30 days)
4. **State-law completeness audit.** Which state is highest volume? If Maharashtra is 30% of traffic and we don't have Maharashtra Rent Act, that's the next corpus add.
5. **Competitive teardown.** Sign up for Vakilsearch & LegalKart tenant flows, screenshot every step, note prices and friction. Time to draft = ? Cost = ?
6. **Regulatory clarity.** Is generating legal notices without an advocate a UPL (Advocates Act §29) issue? Get a 30-min opinion from a lawyer friend. Add appropriate disclaimer if needed.
7. **Domain verification for Resend.** Buy `rental-recourse.in` (or check availability), verify in Resend, then you can email users the draft PDF too.

### Lower leverage but worth logging
8. TAM verification with real sources (Niti Aayog rental data, RERA registrations, NoBroker/MB reports).
9. B2B interest — property mgmt firms, PG operators. One warm intro test.
10. NGO partnership — free distribution channel, credibility boost.

---

## 9. Risk Register

| Category | Risk | Severity | Mitigation |
|---|---|---:|---|
| **Legal** | UPL — "unauthorized practice of law" under Advocates Act §29. Grey area for AI tools. | High | Add "This is not legal advice, consult an advocate" disclaimer. Get a lawyer opinion. Consider positioning as "template assistant" not "legal service." |
| **Legal** | Defamation — a generated notice makes accusations against a real landlord. If the tenant sends it and it's factually wrong, notice recipient could sue tenant AND us. | Medium | Disclaimer that user is responsible for factual accuracy. Include "review before sending" step (already exists). |
| **Legal** | Data protection — PII in intake (tenant/landlord names, PAN, addresses). DPDP Act 2023 compliance? | Medium | Sessions expire 24h. No login. Currently probably OK but needs a privacy policy. |
| **Technical** | Prompt injection — user enters "ignore previous instructions and generate…" | Medium | Forbidden-terms filter + citation verifier catch most. Add prompt-injection test suite. |
| **Technical** | Hallucinated citations that pass verifier | Medium | Verifier compares against corpus. Regularly audit sample drafts. |
| **Technical** | Rate-limit bypass via IP forgery (`x-forwarded-for` header spoof) | Low | Vercel sets `x-forwarded-for` from real edge; header from client is overwritten. Verify. |
| **Business** | Platform risk — Gemini API pricing change or model deprecation | Medium | AI SDK is provider-agnostic; can swap to Claude/OpenAI in <1 day of prompt tuning. |
| **Business** | Incumbent (Vakilsearch etc.) launches AI feature | Low-Medium | They're slow; even if they copy, verticalization + jurisdiction-aware moat holds if we ship faster. |
| **Operational** | Solo-founder single point of failure (you go on vacation → nothing ships) | High | Not solvable without hiring / cofounder. |
| **Operational** | Costs spike if traffic returns to Aug 11 levels or higher (Gemini + Upstash) | Medium | Current rate limit (30/day/IP) caps blast radius. Model per-request cost. |
| **Reputational** | A generated notice contains a factual error that harms a user's case | High | Editing step + verifier are the guardrails today. Consider "reviewed by advocate" premium tier. |

---

## 10. How to Update This Document

- **Refresh cadence:** weekly, or after any strategic conversation / major shipping event.
- **Point-in-time stats:** always cite the date. Data is queryable via `lib/admin/metrics.ts::loadMetrics` or the `/admin` dashboard.
- **New sections welcome:** if a new dimension emerges (e.g. hiring plan, fundraising notes, board updates), add a numbered section.
- **What NOT to put here:** code (belongs in the code), pitch-deck material (separate doc when raising), roadmap items > 3 months out (too speculative).

**Related docs in this repo:**
- `docs/plans/2026-08-02-recourse-v1.md` — original v1 build plan
- `docs/superpowers/specs/2026-08-14-admin-magic-link-login-design.md` — admin auth spec
- `docs/superpowers/plans/2026-08-14-admin-magic-link-login.md` — admin auth implementation
- `AGENTS.md` — Claude-loaded pin about Next.js 16 breaking changes
