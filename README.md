# Recourse

Free web tool for Indian tenants to draft a statute-grounded legal notice when a landlord refuses to return a security deposit. v1 covers Karnataka, Maharashtra, and Model-Tenancy-Act-adopted states (Andhra Pradesh, Tamil Nadu, Uttar Pradesh, Assam).

## Stack

Next.js 16 (App Router, Node runtime), TypeScript, Tailwind 4, Vercel AI SDK v6 + `@ai-sdk/google`, Gemini 2.5 Pro + `gemini-embedding-001` (768-dim), Upstash Vector + Redis + Ratelimit, `@react-pdf/renderer`, `vitest` + `@playwright/test`.

## Local setup

1. `cp .env.example .env.local` and fill in Google AI Studio + Upstash Vector + Upstash Redis credentials.
2. `npm install`
3. Populate the corpus (see **Bare Act text** below), then ingest and smoke-test:
   ```bash
   npm run corpus:ingest
   npm run corpus:smoke   # must pass 10/10 before agent will produce usable drafts
   ```
4. `npm run dev`

## Scripts

- `npm run corpus:fetch` — best-effort fetch of statute text from `indiacode.nic.in` into `data/corpus/`. Sections that cannot be auto-extracted are left as `[PLACEHOLDER — human must paste verified Bare Act text here.]` markers.
- `npm run corpus:ingest` — embed each section with `gemini-embedding-001` and upsert to Upstash Vector namespace `v1`. Refuses to run if any placeholder is present.
- `npm run corpus:smoke` — 10 canned queries; asserts each pulls the expected Act + Section into top-5.
- `npm test` — vitest unit + integration.
- `npm run e2e` — Playwright.

## Bare Act text

`data/corpus/*.md` must contain **verbatim** Bare Act text under `## SECTION N` headers. The citation verifier compares the model's citations against these exact chunks — paraphrasing breaks grounding.

For each of the six acts:

- Karnataka Rent Act, 2001 (sections 9, 12, 27, 30, 34)
- Model Tenancy Act, 2021 (sections 11, 12, 21, 32)
- Maharashtra Rent Control Act, 1999 (sections 7, 24, 33, 55)
- Consumer Protection Act, 2019 (sections 2(7), 2(11), 2(42), 35, 38)
- Indian Contract Act, 1872 (section 74)
- Code of Civil Procedure, 1908 (section 80)

Open the `source_url` in `data/corpus/manifest.json`, copy each section from the official PDF, and replace the `[PLACEHOLDER …]` markers. Verify with:

```bash
grep -l "PLACEHOLDER" data/corpus/*.md && echo "still have placeholders" || echo "OK"
```

## Non-negotiables

- Every legal citation is verified against retrieved corpus chunks before rendering. If verification fails 3× the draft is rejected.
- No output contains "legal advice", "lawyer", "attorney", "counsel" — enforced at prompt + post-generation sanitizer.
- Session-only. No auth, no payments. 24h Redis TTL, 10 drafts/IP/day.

## Deploy

GitHub first; Vercel auto-deploys from `main`. Do not run `vercel deploy` manually. Vercel env vars required: `GOOGLE_GENERATIVE_AI_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Not legal advice.
