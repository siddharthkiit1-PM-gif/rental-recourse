/**
 * Populate data/corpus/*.md with verbatim Bare Act text.
 *
 * Sources (in priority order):
 *   1. IndianKanoon HTML pages that expose <section class="akn-section" id="section_N">
 *      blocks — the cleanest verbatim source we have.
 *   2. Public PDFs (PRS India, indiacode) parsed via pdfjs-dist.
 *
 * Sections that cannot be extracted are written as [PLACEHOLDER …] markers.
 * The ingest script refuses to run while any placeholder remains.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { ACTS } from "../lib/corpus/manifest";

const OUT_DIR = path.resolve("data/corpus");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

async function fetchText(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

async function fetchBuffer(url: string, retries = 2): Promise<Uint8Array> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

function stripHtml(inner: string): string {
  return inner
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * IndianKanoon marks each section as
 *   <section class="akn-section" id="section_74"> … </section>
 * with the next sibling being another akn-section, an akn-chapter, or EOF.
 * We slice on those boundaries and strip HTML.
 *
 * For sub-clause targets like "2(7)", we first find the containing
 * `section_2` block, then narrow to `<section class="akn-subsection" id="section_2.7">`
 * or similar patterns IK uses.
 */
function extractFromIndianKanoon(
  html: string,
  wanted: readonly string[],
): Map<string, string> {
  const out = new Map<string, string>();
  const sectionRe = /<section class="akn-section" id="section_(\d+(?:\.\w+)?)"[^>]*>([\s\S]*?)<\/section>(?=\s*<section class="akn-(?:section|chapter|part)"|\s*<\/section>|\s*$)/g;
  const all = new Map<string, string>();
  for (const m of html.matchAll(sectionRe)) {
    all.set(m[1], m[2]);
  }

  for (const target of wanted) {
    const parenMatch = target.match(/^(\d+)\((\w+)\)$/);
    if (parenMatch) {
      // IK uses nested <section id="section_N.M">…nested paragraphs…</section>.
      // Regex can't handle proper nesting, so we anchor at the start id and
      // slice to the next sibling: another section_N.<num> OR the next
      // top-level section_(N+1). Search the whole HTML, not just the parent.
      const startTag = `id="section_${parenMatch[1]}.${parenMatch[2]}"`;
      const start = html.indexOf(startTag);
      if (start < 0) continue;
      const after = html.slice(start + startTag.length);
      // Match either the next sibling clause (section_N.<other>) or the next act section (section_M where M > N)
      const nextSibling = after.search(
        new RegExp(`id="section_${parenMatch[1]}\\.(?!${parenMatch[2]}\\b)\\w+"|id="section_${Number(parenMatch[1]) + 1}[".]`),
      );
      const slice = nextSibling >= 0 ? after.slice(0, nextSibling) : after;
      const cleaned = stripHtml(slice);
      if (cleaned.length > 20) out.set(target, cleaned);
      continue;
    }
    const raw = all.get(target);
    if (raw) out.set(target, stripHtml(raw));
  }

  return out;
}

/**
 * Extract sections from a PDF's raw text. Bare Act PDFs typically contain
 * an "Arrangement of Sections" table (titles only) followed by the full body.
 * We collect every candidate for section N and keep the longest, which is
 * always the body — TOC entries are single-line titles.
 */
function extractFromPdfText(text: string, wanted: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  const clean = text.replace(/\s+/g, " ").trim();
  for (const sec of wanted) {
    const escaped = sec.replace(/[()]/g, "\\$&");
    const re = new RegExp(
      `\\b${escaped}\\.\\s+([A-Z][\\s\\S]*?)(?=\\s+\\d{1,3}\\.\\s+[A-Z]|\\s+CHAPTER\\s+[IVXLC]|\\s+SCHEDULE|$)`,
      "g",
    );
    let best = "";
    for (const m of clean.matchAll(re)) {
      const body = m[1].trim();
      if (body.length > best.length) best = body;
    }
    if (best) out.set(sec, best.slice(0, 6000));
  }
  return out;
}

async function pdfToText(pdfBytes: Uint8Array): Promise<string> {
  // Legacy build works in Node without a DOM.
  // @ts-expect-error pdfjs-dist has no typings for legacy build path
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: pdfBytes, disableFontFace: true }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out +=
      content.items
        .map((it: { str?: string }) => it.str ?? "")
        .join(" ") + "\n";
  }
  return out;
}

type ActEntry = (typeof ACTS)[keyof typeof ACTS];

async function fetchActSections(act: ActEntry): Promise<Map<string, string>> {
  const ik = (act as { indiankanoon_doc_id?: number }).indiankanoon_doc_id;
  const pdf = (act as { pdf_url?: string }).pdf_url;

  if (ik) {
    try {
      const html = await fetchText(`https://indiankanoon.org/doc/${ik}/`);
      const sections = extractFromIndianKanoon(html, act.sections);
      if (sections.size === act.sections.length) return sections;
      console.warn(
        `  IndianKanoon returned ${sections.size}/${act.sections.length} sections`,
      );
      if (pdf) {
        console.warn(`  falling back to PDF (${pdf})`);
        const bytes = await fetchBuffer(pdf);
        const text = await pdfToText(bytes);
        const pdfSections = extractFromPdfText(text, act.sections);
        for (const [k, v] of pdfSections) if (!sections.has(k)) sections.set(k, v);
      }
      return sections;
    } catch (err) {
      console.warn(`  IK fetch failed: ${(err as Error).message}`);
    }
  }

  if (pdf) {
    try {
      const bytes = await fetchBuffer(pdf);
      const text = await pdfToText(bytes);
      return extractFromPdfText(text, act.sections);
    } catch (err) {
      console.warn(`  PDF fetch failed: ${(err as Error).message}`);
    }
  }

  return new Map();
}

interface ActManifestEntry {
  file: string;
  sections: readonly string[];
  source_url: string;
  sha: string;
  has_placeholders: boolean;
  missing_sections?: string[];
}

async function preserveExisting(filePath: string): Promise<Map<string, string>> {
  try {
    const md = await readFile(filePath, "utf8");
    const out = new Map<string, string>();
    const re = /^## SECTION (.+?)$/gm;
    const matches = [...md.matchAll(re)];
    for (let i = 0; i < matches.length; i++) {
      const sec = matches[i][1].trim();
      const start = matches[i].index! + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
      const body = md.slice(start, end).trim();
      if (body && !body.includes("PLACEHOLDER")) out.set(sec, body);
    }
    return out;
  } catch {
    return new Map();
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest: {
    version: string;
    ingested_at: string;
    acts: Record<string, ActManifestEntry>;
  } = { version: "v1", ingested_at: new Date().toISOString(), acts: {} };

  let placeholderActs = 0;

  for (const [key, act] of Object.entries(ACTS)) {
    console.log(`\n== ${act.name} ==`);
    const filePath = path.join(OUT_DIR, act.file);
    const existing = await preserveExisting(filePath);

    const fetched = await fetchActSections(act);

    // Any extraction shorter than 200 chars is almost certainly a title-only
    // capture (arrangement-of-sections page, marginalia, etc.) — reject and
    // let it fall through to the placeholder path so a human notices.
    const MIN_BODY_LEN = 200;

    const sections = new Map<string, string>();
    for (const s of act.sections) {
      if (existing.has(s) && existing.get(s)!.length >= MIN_BODY_LEN) {
        sections.set(s, existing.get(s)!);
      } else if (fetched.has(s) && fetched.get(s)!.length >= MIN_BODY_LEN) {
        sections.set(s, fetched.get(s)!);
      }
    }
    const missing = act.sections.filter((s) => !sections.has(s));
    for (const s of missing) {
      sections.set(
        s,
        `[PLACEHOLDER — could not auto-extract Section ${s} from ${act.source_url}. Paste verbatim Bare Act text here.]`,
      );
    }

    const body = [
      `# ${act.name}`,
      "",
      `> Source: ${act.source_url}`,
      `> Fetched: ${new Date().toISOString()}`,
      `> State scope: ${act.state_scope.join(", ")}`,
      "",
      ...act.sections.flatMap((n) => [`## SECTION ${n}`, "", sections.get(n)!, ""]),
    ].join("\n");

    await writeFile(filePath, body, "utf8");
    const sha = createHash("sha256").update(body).digest("hex").slice(0, 12);
    manifest.acts[key] = {
      file: act.file,
      sections: act.sections,
      source_url: act.source_url,
      sha,
      has_placeholders: missing.length > 0,
      ...(missing.length ? { missing_sections: missing } : {}),
    };
    if (missing.length) placeholderActs++;
    console.log(
      `  ✓ wrote ${act.file} (${sha}${missing.length ? `, MISSING ${missing.join(",")}` : ""})`,
    );
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `\nDone. ${placeholderActs} act(s) still have placeholders needing human review.`,
  );
  if (placeholderActs > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
