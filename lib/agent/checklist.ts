import type { EvidenceChecklist, IntakePayload, ForumResult } from "./types";

const LABEL: Record<string, string> = {
  rent_agreement: "Written rent agreement",
  bank_transfer_proof: "Bank transfer proof of deposit payment",
  whatsapp_email: "WhatsApp / email communication with landlord",
  joint_inspection_report: "Joint move-out inspection report",
  move_out_photos: "Photos/videos of move-out condition",
  rent_receipts: "Rent receipts",
};

export function evidenceChecklist(
  intake: IntakePayload,
  forum: ForumResult,
): EvidenceChecklist {
  const attached = intake.evidence_available.map((e) => LABEL[e] ?? e);
  const recommended: string[] = [];
  const flags: string[] = [];

  if (!intake.evidence_available.includes("rent_agreement")) {
    flags.push(
      "Absence of a written rent agreement weakens the case. Attach WhatsApp or email evidence acknowledging tenancy.",
    );
  }
  if (!intake.evidence_available.includes("bank_transfer_proof")) {
    flags.push(
      "No bank transfer proof for the deposit. If paid in cash, attach any contemporaneous receipts, WhatsApp acknowledgements, or witness statements.",
    );
  }
  if (!intake.evidence_available.includes("move_out_photos")) {
    recommended.push(
      "Photos/videos of the property condition at move-out (rebuts inflated damage claims).",
    );
  }
  if (!intake.evidence_available.includes("joint_inspection_report")) {
    recommended.push(
      "Joint move-out inspection report signed by both parties, if available.",
    );
  }
  if (
    forum.primary_forum === "consumer_commission" ||
    forum.secondary_forum === "consumer_commission"
  ) {
    recommended.push(
      "Proof of dispatch of the legal notice (Speed Post / Registered Post tracking receipt).",
    );
  }
  return { attached, recommended_additional: recommended, missing_weakness_flags: flags };
}
