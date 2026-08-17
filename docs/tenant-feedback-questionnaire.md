# Tenant Feedback Questionnaire — Recourse (Tally)

> **How to use this file (Tally):**
>
> **Option 1 — Tally AI form builder:** In Tally, click "Create form" → "AI form generator" (or the "Generate with AI" button). Paste this entire document with the prompt:
>
> *"Build this exact form. Preserve every question type, every option, the required flags, and the section breaks as separate pages. For Q8, add a logic rule: if the answer is 'Yes — I completed a draft' OR 'Yes — I started but didn't complete', continue to Q9; otherwise, jump to Section 4. For Q14, use a native Ranking block instead of checkboxes (drag-to-rank, all options ranked). Title the form 'Recourse — how do we build for tenants?' Set the thank-you screen to: 'Thanks. We read every response, and if you left your email we'll follow up personally.'"*
>
> **Option 2 — Manual build:** Create a new form → add a page-break block between each section below → copy questions in order. Tally block mapping:
> - Multiple choice → **Multiple Choice**
> - Checkboxes → **Checkboxes**
> - Short answer → **Short Answer**
> - Long answer → **Long Answer**
> - Linear scale → **Linear Scale**
> - Q14 ranking → **Ranking** (native, drag-to-rank)
> - Q8 branching → use the **Logic** menu on Q8

---

## Context for the reader (not part of the form)

- **Distribution:** LinkedIn viral post (~400K impressions, 3.6K reactions, 170 comments, 90 reposts). Audience is mostly Indian urban professionals, 25–40, mix of tenants + PMs + a few lawyers.
- **Goal:** in ONE 3–5 min survey, capture (a) segment (renter today vs recently vs never), (b) real pain points across the rental lifecycle, (c) direct feedback on Recourse from those who tried it, (d) category-discovery signal for what to build next, (e) willingness-to-pay across pricing tiers, (f) willingness to share sensitive artefacts (agreement, video, consult), (g) aha-moment articulation, (h) interview opt-in.
- **Design decisions:** branching keeps non-Recourse-users from being asked product-specific questions (they'd guess). Q14 uses Tally's native Ranking block (drag to reorder) — better signal than a top-3 checkbox because we get the full priority ordering, not just membership. Every "willingness to pay" question offers a "free-only" option to avoid biasing upward.
- **Comment-informed additions:** questions about the stuck-report bug (surfaced by two commenters), the landlord-reputation ("Glassdoor for landlords") feature request, escrow interest, and language coverage — all traced back to what actual readers asked for.

---

## Form settings (Tally: apply these)

- **Layout:** page-by-page (one question or one section per page). Tally's "Page break" block enforces this.
- **Progress indicator:** on (Tally: form Settings → "Show progress bar").
- **Response notifications:** on for your admin email (Tally: Integrations → Email → notify on submit).
- **Collect email:** off at form level. We ask for email optionally in Section 7 so respondents can stay anonymous.
- **Redirect / Thank-you:** custom thank-you screen (text above); no external redirect.
- **Google Sheets sync:** on (Tally: Integrations → Google Sheets). Fresh sheet for cleaner analysis.
- **Response cap:** none.
- **Public URL:** enable public sharing so you can drop the link into a LinkedIn comment / repost / DM.

---

## Section 1 — About you

### Q1 [Short answer, required]
**Which city do you live in right now?**
(No options — free text so we can spot demand from unlisted cities.)

### Q2 [Multiple choice, required]
**Which best describes you today?**
- Currently renting
- Between rentals (moved out in the last 6 months)
- Landlord
- Both landlord and tenant
- Neither — just here from the LinkedIn post

### Q3 [Multiple choice, required]
**In the last 24 months, have you personally had a rental dispute (deposit, eviction, harassment, agreement)?**
- Yes, still unresolved
- Yes, resolved (I got what I wanted)
- Yes, resolved (I gave up / took the loss)
- No, but I know someone who has
- No, none

---

## Section 2 — Your rental reality

### Q4 [Checkboxes, required, limit 3]
**Pick the top 3 rental headaches you've actually faced or genuinely fear (max 3)**
- Security deposit not returned in full
- Landlord went silent / unreachable during move-out
- Deposit deducted for unfair "wear and tear" or repainting
- Illegal or short-notice eviction pressure
- Rental agreement had unfair clauses I didn't catch at signing
- Rent hike without proper notice
- Utility / maintenance disputes
- Broker fraud or hidden charges
- Verbal-only agreement, nothing in writing
- Harassment (visits without notice, personal calls, etc.)
- Never faced any yet, but I worry about it

### Q5 [Linear scale 1–5, required]
**How confident are you handling a rental dispute on your own, without a lawyer?**
- Scale: 1 = "Completely lost, wouldn't know where to start" → 5 = "Very confident, I'd file it myself"

### Q6 [Multiple choice, required]
**If you HAVE had a rental dispute, what did you actually do about it? (Pick the closest.)**
- Nothing / gave up
- Sent a letter or WhatsApp myself, no template
- Used a free online template
- Used an online tool (like Recourse or similar)
- Hired a lawyer (₹500–₹2,000)
- Contacted a free legal aid / NGO
- Filed in consumer court / rent controller
- Not applicable — no dispute

### Q7 [Long answer, optional]
**In one or two sentences, what's the ONE thing that would have made your rental dispute easier?**
(Free text.)

---

## Section 3 — Only if you tried Recourse

### Q8 [Multiple choice, required, TRIGGERS BRANCH]
**Have you used rental-recourse.vercel.app?**
- Yes — I completed a draft
- Yes — I started but didn't complete
- I looked at it but didn't try
- No — this is the first I'm hearing about it

**Branching logic (Gemini: set "Go to section based on answer"):**
- "Yes — I completed a draft" OR "Yes — I started but didn't complete" → **continue to Q9**
- "I looked at it but didn't try" OR "No — this is the first I'm hearing about it" → **skip to Section 4**

### Q9 [Linear scale 1–5, required if in branch]
**Overall, how was your experience with Recourse?**
- 1 = "Bad, frustrating" → 5 = "Great, would tell a friend"

### Q10 [Checkboxes, required if in branch]
**Did any of these happen to you? (Check all that apply.)**
- Report / draft generation got stuck or never completed
- Site didn't load or crashed
- My state wasn't supported
- The draft didn't feel legally strong enough to actually send
- I wasn't sure what to do after downloading the draft
- I couldn't figure out where to send the notice
- I liked it as-is, no issues
- Other — please describe in the next question

### Q11 [Multiple choice, required if in branch]
**Did you actually SEND the notice you drafted?**
- Yes, I sent it to my landlord as-is
- Yes, but I had a lawyer review it first
- No — still deciding whether to send
- No — the draft wasn't good enough as-is
- No — the situation resolved without needing to send
- I never got a final draft (see Q10)

### Q12 [Long answer, optional]
**What's the ONE thing missing from Recourse that would have made a real difference for you?**

---

## Section 4 — What to build next

### Q13 [Checkboxes, required]
**Which of these have you PERSONALLY needed in the last 12 months? (Check all that apply.)**
- Drafting a legal notice for deposit or dispute
- Drafting a fresh rental agreement before signing
- Reviewing an existing rental agreement for risky clauses
- Consulting a lawyer on a rental matter
- Filing a case in consumer court or rent controller
- Move-in / move-out damage documentation (video / photo record)
- Landlord background check or reviews (before renting)
- Getting a notice stamped and mailed by registered post
- Escrow / neutral holding of deposit at move-in
- None of the above yet

### Q14 [Ranking, required]
**If Recourse could add these things next, drag them into your order of importance (top = most wanted).**
- Rental agreement drafter with tenant-fair defaults
- Rental agreement analyzer (upload existing, we flag red clauses)
- Video / chat consult with a verified legal advisor on the platform
- Notice-to-post — we stamp, sign, and register-post the notice to the landlord for you
- Landlord reputation / reviews ("Glassdoor for landlords")
- Deposit escrow product (deposit held neutrally, automated release rules)
- Move-in / move-out video vault (encrypted, timestamped, subpoena-ready)
- Local-language support (Hindi, Kannada, Tamil, Marathi, etc.)
- WhatsApp bot version — same product, chat interface

### Q15 [Long answer, optional]
**Any rental problem you wish had a product but doesn't exist yet? Tell us.**

---

## Section 5 — Willingness to pay + share

### Q16 [Multiple choice, required]
**For a LAWYER-VETTED, STAMPED legal notice mailed by registered post to your landlord, what feels fair to pay?**
- Should be free
- ₹99
- ₹299
- ₹499
- ₹799
- ₹999+
- I'd only pay a % of what I recover (e.g. 5–10% of deposit)

### Q17 [Multiple choice, required]
**For a 30-min consult with a verified legal advisor (video or chat) about your rental issue, what feels fair?**
- Should be free
- ₹99
- ₹299
- ₹499
- ₹799
- ₹999+

### Q18 [Multiple choice, required]
**Would you upload your SIGNED rental agreement so we can identify specific clauses that support your case?**
- Yes, fully — I trust it if the product is legitimate
- Yes, but only with sensitive fields (PAN, Aadhaar, signatures) redacted
- No — privacy concern
- I don't have a written agreement

### Q19 [Multiple choice, required]
**Would you upload your MOVE-IN or MOVE-OUT video / photos to keep as evidence?**
- Yes — I already record these
- Yes, but only if it's encrypted / private
- No — privacy concern
- I've never recorded one

### Q20 [Multiple choice, required]
**Would you use a video / chat CONSULT WITH A LEGAL ADVISOR directly on the platform (instead of finding one externally)?**
- Yes — I'd prefer this over hunting for a lawyer myself
- Only if I can see reviews / verification badge
- No — I prefer a traditional lawyer relationship
- No — I don't think I need lawyer input

---

## Section 6 — Aha moment

### Q21 [Long answer, required]
**Imagine Recourse becomes your go-to for anything rental. What's the ONE feature, moment, or outcome that would make you say "wow, this actually saved me"?**
(Free text — this is our aha-moment question. Please answer even if you haven't used Recourse yet — hypothetical is fine.)

---

## Section 7 — Stay in touch (optional)

### Q22 [Multiple choice, required]
**Would you be open to a 15-min interview so we can dig deeper into your story?**
- Yes, happy to
- Maybe — depends on scheduling
- No thanks

### Q23 [Short answer, optional]
**Email (only if you want us to follow up for interview / early access to new features)**

### Q24 [Short answer, optional]
**WhatsApp number (only if you'd prefer we reach out on WhatsApp)**

### Q25 [Long answer, optional]
**Anything else you want us to know? Anything we didn't ask that we should have?**

---

## Post-launch: how to analyze the responses

When results come in, look for these signals in order of priority:

1. **Segment sizes.** Q2 + Q3 tells you what % of respondents are actually your target (currently-renting-with-dispute). Filter all other analysis to that segment first.
2. **Pain concentration.** Q4 top-3 aggregated — the top 3 pains should map to your 90-day roadmap. Anything below rank 4 is not next quarter's problem.
3. **Current-product friction.** Q10 checkboxes — sort by frequency. If "generation got stuck" is ≥15% of Recourse users, that's a P0 bug (comments already hinted at this).
4. **Send-rate.** Q11 — what fraction of drafters actually SENT? This is your true completion metric, not just "draft generated". Ratelimit analytics can't tell you this; only self-report can.
5. **Category signal.** Q13 (past need, multi-select) vs Q14 (ranked would-use). Compute mean rank for each option in Q14 (lower = more wanted). Cross-reference with Q13 — an option that ranks top-3 in Q14 but scores low in Q13 is aspirational demand (worth building only if you can create the trigger); one that scores high on both is proven demand (build now).
6. **WTP curves.** Q16 + Q17 — plot the price ladder. The median tells you your MVP price; the shape tells you if there's a small high-intent tier worth building for.
7. **Trust signal.** Q18 + Q19 — % who'd upload rental agreement vs video is a direct proxy for how much data-trust you've earned. Below 40% = you have a trust-marketing problem to solve before you can ship these features.
8. **Aha-moment themes.** Q21 — cluster free-text answers. If a common phrase emerges ("I want it done for me", "I want to know before signing"), that's your positioning.
9. **Interview pool.** Q22 = Yes → your first 5 user interviews. Prioritize by Q3 (unresolved dispute) + Q4 (matches your product's core pain).
10. **Comment-mirrored bugs / requests.** Cross-reference free-text answers (Q7, Q12, Q15, Q25) against the LinkedIn comment themes — if a bug or feature request appears in BOTH channels, it's real.
