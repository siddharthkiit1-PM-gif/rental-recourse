import { GoogleGenAI } from "@google/genai";
import { vectorIndex, namespaceFor } from "@/lib/vector/client";
import { CORPUS_VERSION } from "@/lib/corpus/manifest";

let _genai: GoogleGenAI | null = null;
function genai(): GoogleGenAI {
  if (_genai) return _genai;
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
  _genai = new GoogleGenAI({ apiKey });
  return _genai;
}

export type RetrievedChunk = {
  id: string;
  score: number;
  text: string;
  act_name: string;
  section_number: string;
  state_scope: string[];
  subject_tags: string[];
  source_url: string;
};

export type RetrieveOptions = {
  query: string;
  state: string;
  subject_tags?: string[];
  topK?: number;
};

async function embedQuery(text: string): Promise<number[]> {
  const res = await genai().models.embedContent({
    model: "gemini-embedding-001",
    contents: [{ role: "user", parts: [{ text }] }],
    config: { outputDimensionality: 768, taskType: "RETRIEVAL_QUERY" },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values) throw new Error("no embedding returned");
  return values;
}

export function stateApplicabilityFilter(state: string): string {
  const safe = state.replace(/'/g, "''");
  return `(state_scope CONTAINS '*') OR (state_scope CONTAINS '${safe}')`;
}

export async function retrieve({
  query,
  state,
  subject_tags,
  topK = 5,
}: RetrieveOptions): Promise<RetrievedChunk[]> {
  const vec = await embedQuery(query);
  let filter = stateApplicabilityFilter(state);
  if (subject_tags?.length) {
    const tagClause = subject_tags
      .map((t) => `subject_tags CONTAINS '${t.replace(/'/g, "''")}'`)
      .join(" OR ");
    filter = `(${filter}) AND (${tagClause})`;
  }
  const res = await vectorIndex()
    .namespace(namespaceFor(CORPUS_VERSION))
    .query({ vector: vec, topK, includeMetadata: true, filter });
  return (res as Array<{ id: string; score: number; metadata: Record<string, unknown> }>).map(
    (r) => {
      const m = r.metadata;
      return {
        id: r.id,
        score: r.score,
        text: (m.text as string) ?? "",
        act_name: m.act_name as string,
        section_number: m.section_number as string,
        state_scope: m.state_scope as string[],
        subject_tags: m.subject_tags as string[],
        source_url: m.source_url as string,
      };
    },
  );
}
