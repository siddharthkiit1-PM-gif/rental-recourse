import { z } from "zod";

export const IntakePayload = z.object({
  tenant_name: z.string().min(2).max(200),
  tenant_address: z.string().min(5).max(500),
  landlord_name: z.string().min(2).max(200),
  landlord_address: z.string().min(5).max(500),
  property_address: z.string().min(5).max(500),
  state: z.string().min(2),
  city: z.string().min(2),
  monthly_rent_inr: z.number().positive().max(10_000_000),
  deposit_paid_inr: z.number().positive().max(100_000_000),
  tenancy_start: z.iso.date(),
  tenancy_end: z.iso.date(),
  situation_type_user_selected: z.enum([
    "not_returned",
    "partial_vague_deductions",
    "partial_itemized_disputed",
    "landlord_unreachable",
    "landlord_counter_claiming",
  ]),
  days_since_vacation: z.number().int().min(0).max(3650),
  last_communication_date: z.iso.date().nullable(),
  evidence_available: z.array(
    z.enum([
      "rent_agreement",
      "bank_transfer_proof",
      "whatsapp_email",
      "joint_inspection_report",
      "move_out_photos",
      "rent_receipts",
    ]),
  ),
  free_text_context: z.string().max(500).nullable(),
});
export type IntakePayload = z.infer<typeof IntakePayload>;

export const ClassificationResult = z.object({
  situation_type: z.enum([
    "non_return",
    "vague_deductions",
    "partial_delay",
    "landlord_unreachable",
    "itemized_disputed",
    "ambiguous",
  ]),
  confidence: z.number().min(0).max(1),
  claim_value_inr: z.number().nonnegative(),
  reasoning: z.string().min(20),
});
export type ClassificationResult = z.infer<typeof ClassificationResult>;

export const ForumResult = z.object({
  primary_forum: z.enum([
    "legal_notice",
    "consumer_commission",
    "rent_authority",
    "rent_court",
    "civil_suit",
    "police_complaint",
    "out_of_scope",
  ]),
  secondary_forum: z.enum([
    "consumer_commission",
    "rent_authority",
    "rent_court",
    "civil_suit",
    "police_complaint",
    "none",
  ]),
  jurisdiction: z.string(),
  filing_url: z.string().url().nullable(),
  reasoning: z.string().min(20),
  limitation_flag: z.string().nullable(),
});
export type ForumResult = z.infer<typeof ForumResult>;

export const EvidenceChecklist = z.object({
  attached: z.array(z.string()),
  recommended_additional: z.array(z.string()),
  missing_weakness_flags: z.array(z.string()),
});
export type EvidenceChecklist = z.infer<typeof EvidenceChecklist>;

export const Citation = z.object({
  act: z.string(),
  section: z.string(),
  chunk_id: z.string(),
});
export type Citation = z.infer<typeof Citation>;

export const DraftResult = z.object({
  draft_text: z.string().min(300).max(20_000),
  citations: z.array(Citation),
});
export type DraftResult = z.infer<typeof DraftResult>;

export type AgentStepEvent =
  | { type: "classified"; data: ClassificationResult }
  | { type: "routed"; data: ForumResult }
  | {
      type: "retrieved";
      data: { chunks: Array<{ act: string; section: string; score: number }> };
    }
  | { type: "checklist"; data: EvidenceChecklist }
  | { type: "drafting"; data: { progress: "started" | "done" } }
  | {
      type: "verified";
      data: {
        verified: boolean;
        unverified: Array<{ citation: { act: string; section: string }; reason: string }>;
        corpus_version: string;
      };
    }
  | { type: "complete"; data: { session_id: string; draft: DraftResult } }
  | { type: "error"; data: { message: string; step: string } };
