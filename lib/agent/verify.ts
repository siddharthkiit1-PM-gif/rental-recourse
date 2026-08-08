import type { RetrievedChunk } from "./retrieve";

export type VerifyInput = {
  draft_text: string;
  citations: Array<{ act: string; section: string; chunk_id: string }>;
  chunks: RetrievedChunk[];
  user_state: string;
};

export type VerifyOutput = {
  verified: boolean;
  unverified: Array<{ citation: { act: string; section: string }; reason: string }>;
};

const CASE_LAW_PATTERNS: RegExp[] = [
  / v\. /i,
  /\bAIR\s+\d{4}\b/,
  /\bSCR\b/,
  /\bSCC\s+\d/,
  /\bAIR\s+SC\b/,
];

// Catches: 'Section 12', 'Sec. 12', 'Sec 12', 's. 12', 'S. 12' followed by
// a section number (digits + optional (n) sub-clause). Broader than the
// previous 'Section X of the Y Act, YYYY' form which missed 'Sec.' / 's.'
// / bare-mention surface forms — an unverified section could sneak past.
const SECTION_MENTION_RE =
  /\b(?:Section|Sec\.?|s\.|S\.)\s+(\d+(?:\([^)]+\))?)/g;

export function verifyCitations(input: VerifyInput): VerifyOutput {
  const { draft_text, citations, chunks, user_state } = input;
  const unverified: VerifyOutput["unverified"] = [];

  for (const re of CASE_LAW_PATTERNS) {
    if (re.test(draft_text)) {
      unverified.push({
        citation: { act: "(case law)", section: "-" },
        reason: `Draft references case law (${re.source}), which is forbidden.`,
      });
    }
  }

  for (const c of citations) {
    const chunk = chunks.find(
      (k) => k.act_name === c.act && k.section_number === c.section,
    );
    if (!chunk) {
      unverified.push({
        citation: c,
        reason: `Cited section not present in retrieved corpus chunks.`,
      });
      continue;
    }
    if (chunk.id !== c.chunk_id) {
      unverified.push({ citation: c, reason: `chunk_id mismatch for cited section.` });
      continue;
    }
    const applies =
      chunk.state_scope.includes("*") || chunk.state_scope.includes(user_state);
    if (!applies) {
      unverified.push({
        citation: c,
        reason: `Citation to state-specific act ${c.act} not applicable to user state ${user_state}.`,
      });
    }
  }

  // Every section number mentioned in the draft must appear in citations[].
  // We match by section number alone (not act name) — if the model wrote
  // 's. 12' without spelling out an act, we still catch it if 12 isn't
  // declared. Errs slightly on the side of over-flagging (a legit section
  // number appearing as body prose like 'within 12 days' won't match since
  // the regex requires the Section/Sec/s. prefix).
  const declaredSections = new Set(citations.map((c) => c.section));
  const mentions = [...draft_text.matchAll(SECTION_MENTION_RE)];
  const reportedMissing = new Set<string>();
  for (const m of mentions) {
    const section = m[1].trim();
    if (declaredSections.has(section) || reportedMissing.has(section)) continue;
    reportedMissing.add(section);
    unverified.push({
      citation: { act: "(unspecified)", section },
      reason: `Draft mentions Section ${section} but no citation with that section number was declared.`,
    });
  }

  return { verified: unverified.length === 0, unverified };
}
