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

const SECTION_MENTION_RE =
  /\bSection\s+([\w\d()]+)\s+of\s+the\s+([A-Z][A-Za-z',&.\s]+?(?:Act|Procedure|Code),?\s*\d{4})/g;

function normalizeActName(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/,\s*/g, ", ")
    .trim();
}

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

  const mentions = [...draft_text.matchAll(SECTION_MENTION_RE)];
  for (const m of mentions) {
    const section = m[1].trim();
    const actMentioned = normalizeActName(m[2]);
    const declared = citations.some((c) => {
      if (c.section !== section) return false;
      const citedActHead = normalizeActName(c.act).split(",")[0];
      const mentionedHead = actMentioned.split(",")[0];
      return citedActHead === mentionedHead;
    });
    if (!declared) {
      unverified.push({
        citation: { act: actMentioned, section },
        reason: `Draft mentions this section but did not declare it in citations[].`,
      });
    }
  }

  return { verified: unverified.length === 0, unverified };
}
