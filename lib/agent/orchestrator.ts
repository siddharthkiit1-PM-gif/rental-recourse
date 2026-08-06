import type { UIMessageStreamWriter } from "ai";
import { classify } from "./classify";
import { routeForum } from "./route";
import { retrieve } from "./retrieve";
import { evidenceChecklist } from "./checklist";
import { draftNotice } from "./draft";
import { verifyCitations } from "./verify";
import { CORPUS_VERSION } from "@/lib/corpus/manifest";
import { containsForbidden } from "@/lib/safety/forbidden";
import type {
  IntakePayload,
  DraftResult,
  ClassificationResult,
  ForumResult,
  EvidenceChecklist,
} from "./types";

export type AgentSuccess = {
  draft: DraftResult;
  classification: ClassificationResult;
  forum: ForumResult;
  checklist: EvidenceChecklist;
  corpus_version: string;
};

const MAX_REGEN_ATTEMPTS = 3;

type Writer = Pick<UIMessageStreamWriter, "write">;

const OUT_OF_SCOPE_KEYWORDS = /\b(shop|office|commercial premises|godown|warehouse|storefront)\b/i;

export async function runAgent(
  intake: IntakePayload,
  sessionId: string,
  writer: Writer,
): Promise<AgentSuccess | { error: string }> {
  try {
    if (
      intake.free_text_context &&
      OUT_OF_SCOPE_KEYWORDS.test(intake.free_text_context)
    ) {
      writer.write({
        type: "data-error",
        data: {
          step: "classify",
          message:
            "Commercial leases (shops, offices, godowns, warehouses) have a different legal framework. This tool covers residential tenancy only. Consult a professional.",
        },
      });
      return { error: "commercial lease" };
    }

    if (new Date(intake.tenancy_end) > new Date()) {
      writer.write({
        type: "data-error",
        data: {
          step: "classify",
          message:
            "You appear to be a current tenant. This tool is for deposit recovery after vacation; mid-tenancy grievances are not yet supported.",
        },
      });
      return { error: "current tenant" };
    }

    const classification = await classify(intake);
    writer.write({ type: "data-classified", data: classification });

    const situationForRouting: Exclude<ClassificationResult["situation_type"], "ambiguous"> =
      classification.situation_type === "ambiguous" ? "non_return" : classification.situation_type;

    const forum = routeForum({
      situation_type: situationForRouting,
      claim_value_inr: classification.claim_value_inr,
      state: intake.state,
      city: intake.city,
    });
    writer.write({ type: "data-routed", data: forum });

    const chunks = await retrieve({
      query: `${classification.situation_type} security deposit refund ${forum.primary_forum} ${intake.state}`,
      state: intake.state,
      topK: 5,
    });
    writer.write({
      type: "data-retrieved",
      data: {
        chunks: chunks.map((c) => ({
          act: c.act_name,
          section: c.section_number,
          score: c.score,
        })),
      },
    });

    const checklist = evidenceChecklist(intake, forum);
    writer.write({ type: "data-checklist", data: checklist });

    let draft: DraftResult | null = null;
    for (let attempt = 1; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
      writer.write({ type: "data-drafting", data: { progress: "started" } });
      const candidate = await draftNotice({ intake, classification, forum, checklist, chunks });
      const v = verifyCitations({
        draft_text: candidate.draft_text,
        citations: candidate.citations,
        chunks,
        user_state: intake.state,
      });
      const forbidden = containsForbidden(candidate.draft_text);
      writer.write({
        type: "data-verified",
        data: {
          verified: v.verified && forbidden.length === 0,
          unverified: v.unverified,
          corpus_version: CORPUS_VERSION,
        },
      });
      if (v.verified && forbidden.length === 0) {
        draft = candidate;
        break;
      }
      if (attempt === MAX_REGEN_ATTEMPTS) {
        writer.write({
          type: "data-error",
          data: {
            step: "verify",
            message: `Draft failed verification after ${MAX_REGEN_ATTEMPTS} attempts (${v.unverified.length} unverified, ${forbidden.length} forbidden terms).`,
          },
        });
        return { error: "verification failed" };
      }
    }

    writer.write({ type: "data-complete", data: { session_id: sessionId, draft: draft! } });
    return {
      draft: draft!,
      classification,
      forum,
      checklist,
      corpus_version: CORPUS_VERSION,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    writer.write({ type: "data-error", data: { step: "orchestrator", message } });
    return { error: message };
  }
}
