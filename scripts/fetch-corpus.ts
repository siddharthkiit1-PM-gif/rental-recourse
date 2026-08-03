import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { ACTS } from "../lib/corpus/manifest";

const OUT_DIR = path.resolve("data/corpus");

async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "recourse-corpus-bot/1.0 (+contact via github)" },
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

function extractSectionsFromHtml(
  html: string,
  wantedSections: readonly string[],
): Map<string, string> {
  const result = new Map<string, string>();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  for (const sec of wantedSections) {
    const escaped = sec.replace(/[()]/g, "\\$&");
    const re = new RegExp(
      `\\bSection\\s+${escaped}\\.?\\s+([^§]+?)(?=Section\\s+\\d|$)`,
      "i",
    );
    const m = text.match(re);
    if (m) result.set(sec, m[1].trim().slice(0, 4000));
  }
  return result;
}

interface ActManifestEntry {
  file: string;
  sections: readonly string[];
  source_url: string;
  sha: string;
  has_placeholders: boolean;
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
    let sections: Map<string, string>;
    try {
      const html = await fetchWithRetry(act.source_url);
      sections = extractSectionsFromHtml(html, act.sections);
    } catch (err) {
      console.warn(`  ⚠ fetch failed: ${(err as Error).message}`);
      sections = new Map();
    }
    const missing = act.sections.filter((s) => !sections.has(s));
    if (missing.length) {
      console.warn(
        `  ⚠ ${missing.length}/${act.sections.length} sections not auto-extracted: ${missing.join(", ")}`,
      );
      for (const s of missing)
        sections.set(
          s,
          `[PLACEHOLDER — could not auto-extract Section ${s} from ${act.source_url}. Human must paste verified Bare Act text here.]`,
        );
    }
    const body = [
      `# ${act.name}`,
      "",
      `> Source: ${act.source_url}`,
      `> Fetched: ${new Date().toISOString()}`,
      `> State scope: ${act.state_scope.join(", ")}`,
      "",
      ...[...sections.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
        .flatMap(([n, t]) => [`## SECTION ${n}`, "", t, ""]),
    ].join("\n");
    const filePath = path.join(OUT_DIR, act.file);
    await writeFile(filePath, body, "utf8");
    const sha = createHash("sha256").update(body).digest("hex").slice(0, 12);
    manifest.acts[key] = {
      file: act.file,
      sections: act.sections,
      source_url: act.source_url,
      sha,
      has_placeholders: missing.length > 0,
    };
    if (missing.length) placeholderActs++;
    console.log(
      `  ✓ wrote ${act.file} (${sha}${missing.length ? ", HAS PLACEHOLDERS" : ""})`,
    );
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    `\nDone. ${placeholderActs} act(s) have placeholders needing human review.`,
  );
  if (placeholderActs > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
