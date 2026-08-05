import { config } from "dotenv";
config({ path: ".env.local" });
import { GoogleGenAI } from "@google/genai";

async function main() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
  console.log(`key prefix: ${key.slice(0, 6)}... (len ${key.length})`);
  const genai = new GoogleGenAI({ apiKey: key });
  const res = await genai.models.embedContent({
    model: "gemini-embedding-001",
    contents: [{ role: "user", parts: [{ text: "hello world" }] }],
    config: { outputDimensionality: 1536, taskType: "RETRIEVAL_QUERY" },
  });
  const dim = res.embeddings?.[0]?.values?.length;
  console.log(`✓ embedding returned, dim=${dim}`);
}
main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exit(1);
});
