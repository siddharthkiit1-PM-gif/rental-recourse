import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type {
  DraftResult,
  IntakePayload,
  ClassificationResult,
  ForumResult,
  EvidenceChecklist,
} from "./types";
import type { RetrievedChunk } from "./retrieve";
import { SAFETY_HEADER } from "./prompts";
import { sanitizeForbidden } from "@/lib/safety/forbidden";

const DraftSchema = z.object({
  draft_text: z.string(),
  citations: z.array(
    z.object({
      act: z.string(),
      section: z.string(),
      chunk_id: z.string(),
    }),
  ),
});

export type DraftInput = {
  intake: IntakePayload;
  classification: ClassificationResult;
  forum: ForumResult;
  checklist: EvidenceChecklist;
  chunks: RetrievedChunk[];
};

function referenceBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (c) =>
        `--- chunk_id=${c.id}\n${c.act_name}, Section ${c.section_number}:\n${c.text}\n`,
    )
    .join("\n");
}

export async function draftNotice(input: DraftInput): Promise<DraftResult> {
  const { intake, classification, forum, checklist, chunks } = input;
  const prompt = `${SAFETY_HEADER}

You are drafting a formal pre-litigation legal notice on behalf of a tenant seeking return of a security deposit from a landlord in India.

REFERENCE TEXT (only cite sections that appear below; if you need a section not present, do not cite it):
${referenceBlock(chunks)}

REQUIREMENTS:
- Formal, non-inflammatory tone. No emotive or accusatory language.
- Structure: header ("LEGAL NOTICE" and framing under Section 80 of the Code of Civil Procedure, 1908 where applicable), "From:", "To: [Landlord name and address]", "Date:", "Subject:", numbered paragraphs (1..N), demand paragraph with clear ask (return of deposit within 15 days), notice of intended further action if ignored, closing.
- Include placeholders "[Your name]", "[Landlord name and address]", "[Your address]" — the user will fill these before sending.
- Every legal claim in the draft MUST cite one of the reference sections above by act name and section number.
- Do not invent case law or judgments.
- 400-1000 words.
- For each citation, emit a citations[] entry with the exact chunk_id from the reference block.

INTAKE:
${JSON.stringify(intake, null, 2)}

CLASSIFICATION: ${classification.situation_type} (confidence ${classification.confidence.toFixed(2)}, claim ₹${classification.claim_value_inr.toLocaleString("en-IN")})
FORUM: primary=${forum.primary_forum} secondary=${forum.secondary_forum} jurisdiction=${forum.jurisdiction}
EVIDENCE ATTACHED: ${checklist.attached.join(", ")}
WEAKNESS FLAGS: ${checklist.missing_weakness_flags.join("; ") || "none"}
`;

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: DraftSchema,
    prompt,
    temperature: 0.4,
  });

  return {
    draft_text: sanitizeForbidden(object.draft_text),
    citations: object.citations,
  };
}
