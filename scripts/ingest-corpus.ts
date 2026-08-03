import { readFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { vectorIndex, namespaceFor } from "../lib/vector/client";
import {
  ACTS,
  CORPUS_VERSION,
  MTA_ADOPTED_STATES,
  type ActKey,
} from "../lib/corpus/manifest";
import { actSlug } from "../lib/util/slug";

const CORPUS_DIR = path.resolve("data/corpus");

type Chunk = { id: string; text: string; metadata: Record<string, unknown> };

function parseSections(markdown: string, sections: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  const re = /^## SECTION (.+?)$/gm;
  const matches = [...markdown.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const sec = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : markdown.length;
    const body = markdown.slice(start, end).trim();
    if (sections.includes(sec)) out.set(sec, body);
  }
  return out;
}

function subjectTagsFor(actKey: ActKey, sec: string): string[] {
  const tags: string[] = [];
  if (["12", "11"].includes(sec)) tags.push("deposit_refund", "timeline");
  if (["9"].includes(sec)) tags.push("deposit_cap");
  if (["27", "30", "34", "21", "32", "33"].includes(sec)) tags.push("forum", "jurisdiction");
  if (sec === "80") tags.push("legal_notice_format");
  if (sec === "74") tags.push("penalty_clause", "forfeiture");
  if (actKey === "CONSUMER_PROTECTION_ACT_2019") tags.push("consumer_commission");
  if (sec.startsWith("2(")) tags.push("definitions");
  if (["35", "38"].includes(sec) && actKey === "CONSUMER_PROTECTION_ACT_2019")
    tags.push("complaint_procedure");
  return [...new Set(tags)];
}

async function embed(
  genai: GoogleGenAI,
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[]> {
  const res = await genai.models.embedContent({
    model: "gemini-embedding-001",
    contents: [{ role: "user", parts: [{ text }] }],
    config: { outputDimensionality: 768, taskType },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values || values.length !== 768) throw new Error(`bad embedding len=${values?.length}`);
  return values;
}

async function main() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set in .env.local");
  const genai = new GoogleGenAI({ apiKey });

  const chunks: Chunk[] = [];
  for (const [actKey, act] of Object.entries(ACTS)) {
    const md = await readFile(path.join(CORPUS_DIR, act.file), "utf8");
    const sections = parseSections(md, act.sections);
    for (const [sec, body] of sections) {
      if (body.includes("PLACEHOLDER"))
        throw new Error(`corpus has placeholder in ${act.file} sec ${sec}`);
      const id = `${actSlug(act.name)}__sec_${sec.replace(/[()]/g, "_")}__${CORPUS_VERSION}`;
      chunks.push({
        id,
        text: body,
        metadata: {
          act_key: actKey,
          act_name: act.name,
          section_number: sec,
          state_scope: act.state_scope,
          subject_tags: subjectTagsFor(actKey as ActKey, sec),
          source_url: act.source_url,
          corpus_version: CORPUS_VERSION,
          mta_adopted_states: [...MTA_ADOPTED_STATES],
          text: body,
        },
      });
    }
  }
  console.log(`Ingesting ${chunks.length} chunks to namespace "${CORPUS_VERSION}"...`);
  const index = vectorIndex();
  const namespace = namespaceFor(CORPUS_VERSION);
  const vectors: Array<{ id: string; vector: number[]; metadata: Record<string, unknown> }> = [];
  for (const c of chunks) {
    const vec = await embed(genai, c.text, "RETRIEVAL_DOCUMENT");
    vectors.push({ id: c.id, vector: vec, metadata: c.metadata });
    console.log(`  ✓ ${c.id}`);
  }
  await index.namespace(namespace).upsert(vectors);
  console.log(`Done. Upserted ${vectors.length} vectors to namespace ${namespace}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
