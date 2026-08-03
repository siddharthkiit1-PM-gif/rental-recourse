const FORBIDDEN: Array<{ term: RegExp; replacement: string }> = [
  { term: /\blegal\s+advice\b/gi, replacement: "informational guidance" },
  { term: /\blegal\s+counsel\b/gi, replacement: "professional guidance" },
  { term: /\b(an?)\s+attorney(s)?\b/gi, replacement: "a professional$2" },
  { term: /\b(an?)\s+lawyer(s)?\b/gi, replacement: "a professional$2" },
  { term: /\battorney(s)?\b/gi, replacement: "professional$1" },
  { term: /\blawyer(s)?\b/gi, replacement: "professional$1" },
  { term: /\bcounsel\b/gi, replacement: "professional" },
];

export function containsForbidden(text: string): string[] {
  const hits: string[] = [];
  for (const { term } of FORBIDDEN) {
    const m = text.match(term);
    if (m) hits.push(...m.map((s) => s.toLowerCase()));
  }
  return [...new Set(hits)];
}

export function sanitizeForbidden(text: string): string {
  let out = text;
  for (const { term, replacement } of FORBIDDEN) out = out.replace(term, replacement);
  return out;
}
