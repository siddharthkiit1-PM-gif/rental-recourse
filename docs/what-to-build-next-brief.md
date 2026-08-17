# What to Build Next — Strategic Brief for Claude.ai

> **How to use this file:** Paste this entire document into Claude.ai (browser) with the prompt:
>
> *"I'm the solo founder of Recourse, an Indian rental legal-notice tool. Based on the comment analysis, product state, and candidate directions below, help me decide what to prioritize for the next 60 days. Be direct about tradeoffs and push back on my assumptions. Ask me clarifying questions if the framing is missing something important, but don't just re-summarize what I wrote — I want a strategic take, not a rewrite."*

This file is fully self-contained. Claude.ai does not need to look at anything else to reason from it.

---

## 1. Snapshot (60 seconds)

**What Recourse is today:** a free web tool at rental-recourse.vercel.app that takes an Indian tenant through a 6-step intake, then drafts a filing-ready legal notice grounded in state rent law + national statutes (Consumer Protection Act, Contract Act, CPC §80). Currently supports 10 state jurisdictions (7 with dedicated state Rent Acts, 3 via Model Tenancy Act adoption). No lawyer in the loop. No monetization. Session-only (no accounts). Built solo.

**Distribution moment just happened:** a LinkedIn post announcing Recourse hit **~400K impressions, 3,658 reactions, 170 comments, 90 reposts** in ~7 days. This is the acquisition-source mystery, now solved — LinkedIn organic drove the entire Aug 11 traffic spike (501 draft attempts / 383 unique IPs in one day, decaying to <10/day since).

**Where we are:** early product-market-fit signal is real (see comment themes below) but the current wedge is thin (deposit-recovery-notice-only) and the comments are begging for expansion. Multiple directions are viable. Zero funding, solo builder, ~60-day decision horizon before the LinkedIn attention window closes.

**The decision this brief supports:** *What to prioritize building over the next 60 days — depth (fix and monetize current product) or breadth (expand into new adjacent categories the comments demanded)?*

---

## 2. What the market actually said

Below is a compressed analysis of ~170 comments on the announcement post. Organized by theme, not chronology.

### 2a. Problem validation — very strong
- The single most repeated reaction: **"this is my exact story."** Multiple commenters shared personal deposit-withholding stories, ghosted landlords, disputes dragging on for years (one 2-year unresolved case with a broker).
- Even international commenters (Germany) said the same pattern happens there.
- Multiple commenters directly asked the founder *"did you actually get your deposit back?"* — the **outcome** matters as much as the tool. Users are drawn to a founder story with resolution.
- Recognition was concentrated in Bangalore/metro renters — matches Recourse's launch geography.

### 2b. Feature requests — mapped to rental lifecycle

**Before signing (highest-frequency ask):**
- **Rental agreement drafter with tenant-fair defaults.** Multiple requests. Founder acknowledged that default terms should favor 100% deposit return, not the currently-normalized "one month deducted."
- **Rental agreement analyzer.** Upload existing agreement → get flags on risky clauses. Requested by, among others, a PM at Appian.
- **Landlord reputation / "Glassdoor for landlords."** Repeated ask across multiple commenters. Founder called this "the end goal" but requires ~90% accuracy bar and lots of verified data.

**During dispute (current wedge):**
- **Direct filing / delivery integration.** Users want the app to file the notice at the relevant portal, or physically post it via registered post.
- **Broader state and language coverage.** Requests for full national coverage + local-language support (Hindi, Kannada, Tamil, Marathi).
- **Landlord-side version.** Half-jokingly asked by a few — a notice-drafter FOR landlords against tenants who skip rent or damage property.

**Structural (systemic fix, before dispute even happens):**
- **Deposit escrow / bond product.** One commenter proposed holding deposits neutrally with automated release rules — a fintech play, not a legal-notice one.

### 2c. Skepticism & real critiques
- **A lawyer commenter questioned the underlying logic:** why would a legal notice work if the landlord doesn't trust consumer forums anyway? Needs a positioning answer — is the notice about actual enforcement, or about signaling seriousness?
- **Consumer courts are slow.** Multiple commenters said notices alone rarely compel action. Founder framed the notice as a proactive first-step signal, not a resolution mechanism.
- **One-sided framing.** Multiple commenters raised that landlords also get burned (tenants skipping last rent, damaging property). The current copy reads as tenant-vs-landlord adversarial. Some pushback on this frame.
- **Model Tenancy Act citation risk.** A privacy/legal professional flagged that citing MTA is risky since it isn't actually enforced in most states — suggested keeping arguments contractual instead.
- **Delhi-specific issues.** A lawyer tested the Delhi flow and found problems; offered to discuss.
- **Multi-law complexity.** A developer pointed out real disputes often span multiple overlapping laws, and picking a single act to cite may not be sufficient.

### 2d. Bugs reported (unprompted from real users)
- **Report generation gets stuck.** One user said the in-app "takes a while" message never resolved. This is a P0 — surfaced in real conditions.
- **State didn't load.** Another user said the tool wasn't loading for their state.

### 2e. Willingness-to-pay signals
- **At least one commenter explicitly said they'd pay for a specialist "concierge" tier** to actually help recover a stuck deposit. This is the strongest paid-tier signal in the thread.
- **Damage-assessment pricing was called out as fine** (fair-value for effort), but unfair default deductions were criticized.
- No one volunteered a specific price point.

### 2f. Competitive references from commenters
Adjacent products named by commenters, worth a competitive scan:
- **NoBroker.com** — rental listings + payments; has NoBroker Pay for deposit escrow already
- **DigiLawyer.ai** — AI legal assistant
- **eDrafter.in** — document drafting
- **equaljustice.ai** — rent-agreement drafting

### 2g. Distribution / collaboration signals
- Several commenters (a PM at Microsoft, an AI Product Manager, others) asked to DM / collaborate. Suggests contributor/partner pull, not just end-user pull.
- Founder confirmation of 10-state coverage + roadmap responses were well-received.

---

## 3. The four strategic tensions

Naming these explicitly because a good direction has to resolve one or more.

### Tension 1: Depth vs. breadth
- **Depth:** fix the current product (P0 bug, more states, add "post-it-for-me" paid tier). Small scope, ship in 2 weeks.
- **Breadth:** expand into new categories the comments demand (agreement drafter, analyzer, landlord reviews). Larger scope, ship in 4–8 weeks.
- Trap: doing both badly. Solo founder, 60 days.

### Tension 2: Where in the rental lifecycle to live
- **After the fact (current):** legal-notice drafting *when the deposit dispute has already happened*. Emotional urgency is highest here, but volume is lowest (people only have deposit disputes rarely).
- **During the dispute (current + concierge):** notice + posting + lawyer consult. Adds mid-funnel monetization.
- **Before signing:** agreement drafter / analyzer. Volume is 10–100x higher (everyone signs a lease; only some have disputes). But urgency and willingness to pay is lower.
- **Preventive/structural:** escrow, landlord reviews. Highest platform potential, longest build.

### Tension 3: AI-only vs. lawyer-in-loop
- Current: pure AI. Cheap, fast, zero human dependency.
- Lawyer-in-loop: opens paid tier (stamped/signed notice, consult), boosts trust, but adds sales cycle (finding + verifying lawyers) and margin pressure.
- The strongest WTP signal in the comments (concierge service to recover deposit) *implies* a human in the loop.

### Tension 4: Consumer wedge vs. platform
- **Wedge:** stay narrow (deposit-notice tool for tenants), monetize with paid actions on the same flow.
- **Platform:** become a rental-lifecycle OS — reviews, escrow, drafting, notices, consults. Winners are platforms, but platforms take years and capital.
- Solo, unfunded, 60-day horizon: platform is currently a strategic direction, not a build target.

---

## 4. Candidate directions (pick 1–2 for the next 60 days)

Each direction below is a real 60-day path. All assume solo build, no funding, part-time-if-not-full-time.

### Direction A: Harden and monetize the current wedge
**Hypothesis:** the current product works but is thin. Fixing the bugs and adding one paid action (stamped notice mailed by registered post for ₹299–₹499) captures the "concierge" WTP signal directly.

- **Comment evidence:** stuck-generation bug (P0), "state didn't load" bug, concierge-pay signal, requests for physical delivery integration.
- **Effort:** 2–3 weeks (bug fixes + basic ops for stamped-mail — probably need a lawyer partner for signature or use a third-party notarization service).
- **Moat:** minimal — anyone can do stamped-mail-as-a-service.
- **WTP path:** direct — you monetize the users already coming in.
- **Risk:** the current traffic (post-LinkedIn spike) is decaying to near-zero. You may fix a great product for no one.

### Direction B: Move upstream — rental agreement analyzer
**Hypothesis:** the highest-frequency comment ask is agreement drafting/review. The market for "help me not-get-screwed at signing" is 10–100x the size of "help me recover my deposit." Users would upload existing PDFs and get flagged clauses.

- **Comment evidence:** most-repeated feature request. Requested by PMs, non-lawyer readers, several tenants. Founder-agreed default terms should favor tenant.
- **Effort:** 3–5 weeks (PDF ingest, clause classification, red-flag rules, UI). Reuses existing corpus + agent pipeline.
- **Moat:** the "tenant-fair defaults" positioning is defensible. Competitors (eDrafter, equaljustice.ai) do drafting but not analysis of existing agreements.
- **WTP path:** freemium — free analysis, pay for premium (line-by-line lawyer review, PDF re-draft, negotiation letter to landlord).
- **Risk:** longer build cycle. Doesn't monetize the current traffic tail from LinkedIn. Analyzer accuracy has to be genuinely good or trust collapses.

### Direction C: Build the lawyer marketplace
**Hypothesis:** the current tool gets people to a draft; they need a lawyer to actually escalate. Bring verified lawyers on-platform. AI-drafted notice → 30-min lawyer consult → stamped final for a real fee (₹499–₹999).

- **Comment evidence:** lawyer commenters offered to help; concierge-tier WTP signal; skepticism that AI-only is enough for real cases.
- **Effort:** 4–6 weeks (lawyer verification flow, scheduling, payments, split-fee accounting) — heavy for a solo build.
- **Moat:** two-sided marketplace is defensible once liquid, but "getting to liquid" is the whole business.
- **WTP path:** clear (proven margin on lawyer consult); but supply-side sales (recruiting lawyers) is a new muscle.
- **Risk:** you become a lower-margin, lower-defensibility clone of LegalKart. Better only if you win on tenant-focus positioning.

### Direction D: Build "Glassdoor for landlords"
**Hypothesis:** the biggest ask (after agreement analysis) is reputation. Founder already said this is "the end goal" but requires trust and volume. Could be MVP-scoped — anonymous reviews + moderation — as a viral growth loop, not primary revenue.

- **Comment evidence:** repeated in multiple threads; founder-endorsed as end-goal.
- **Effort:** 3–4 weeks for MVP (reviews + moderation + landlord identity resolution). Long tail to reach 90% accuracy bar the founder set.
- **Moat:** network-effect defensibility once volume exists. Very high if achieved.
- **WTP path:** none directly; growth loop that feeds other paid products. Monetize via lead-gen to lawyers or premium landlord verification.
- **Risk:** defamation liability. Fake reviews. Zero revenue for months. Cold-start problem for reviews.

### Direction E: Deposit escrow (fintech)
**Hypothesis:** the structural fix. Hold deposits neutrally at move-in; automated release rules at move-out. Solves the problem at the root.

- **Comment evidence:** one thoughtful commenter proposed exactly this.
- **Effort:** 8+ weeks. Requires payment license or partnership, KYC, escrow legal structure. Real regulatory footprint.
- **Moat:** fintech switching costs are high once adopted.
- **WTP path:** 1–2% fee on held deposit — real margin.
- **Risk:** out of scope for solo unfunded builder. NoBroker Pay already exists as an incumbent. RBI/regulatory sunk cost is high.

---

## 5. Constraints (don't hand-wave these)

- **Solo builder.** No cofounder. Everything you commit to comes at direct opportunity cost.
- **No funding.** Bootstrap only. Any paid tier has to fund its own infrastructure (Gemini API, Upstash, Resend) with margin from day 1.
- **Legal exposure exists.** UPL (Advocates Act §29) risk on AI-generated notices without a lawyer in the loop. DPDP Act if handling PII (rental agreements = high PII). Defamation risk on landlord reviews.
- **Distribution window closing.** LinkedIn post attention decays fast. What you ship in the next 30 days benefits from the attention tail; what you ship in month 3 has to earn its own attention.
- **Product is bleeding-edge tech.** Next.js 16 + AI SDK v6 — you'll spend time on non-strategic problems (upgrade breakage, dep churn).
- **No data-team.** All product decisions have to come from either (a) analytics you already track, (b) the LinkedIn comments, or (c) the survey being launched. There's no user-behavior data pipeline.

---

## 6. What I want Claude.ai to help decide

I want a clear recommendation on which 1–2 of Directions A–E to pursue in the next 60 days, and specifically:

1. **What's the sequencing?** If we pick two, which ships first and why?
2. **Where are my constraints biting more than I've admitted?** Solo + unfunded is a real box; call out if any direction requires resources I don't have and I'm underweighting the difficulty.
3. **Is there a Direction F I'm missing?** A framing I haven't considered — a different wedge, a different customer, a different business model derived from these comments?
4. **How should I use the survey (25-question form going out this week to the same LinkedIn audience) to validate before committing to a direction?** Which 2–3 survey answers are decision-blocking for your recommended direction?
5. **What would you NOT do?** Which direction is a trap disguised as an opportunity, and why?

Push back on any part of my framing that seems weak. I'd rather have a hard conversation with an honest AI now than build the wrong thing for a month.
