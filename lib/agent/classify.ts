import type { IntakePayload, ClassificationResult } from "./types";

/**
 * Deterministic classification from the intake fields alone — no LLM call.
 *
 * The intake already asks the user to pick a situation and states the deposit
 * amount, so calling Gemini to infer both from the same fields was wasting
 * ~7s per request (measured against production). We map the radio choice
 * directly, treat the full unrecovered deposit as claim_value_inr, and only
 * fall back to a lightweight heuristic to catch the 'partial_delay' case
 * where a user picked 'not_returned' but their free text mentions a promise.
 */
const SITUATION_MAP: Record<
  IntakePayload["situation_type_user_selected"],
  ClassificationResult["situation_type"]
> = {
  not_returned: "non_return",
  partial_vague_deductions: "vague_deductions",
  partial_itemized_disputed: "itemized_disputed",
  landlord_unreachable: "landlord_unreachable",
  landlord_counter_claiming: "itemized_disputed",
};

const DELAY_KEYWORDS =
  /\b(promised|will pay|will refund|reminder|delayed?|postpone|in \d+ days|next month|assured)\b/i;

export async function classify(intake: IntakePayload): Promise<ClassificationResult> {
  let situation_type = SITUATION_MAP[intake.situation_type_user_selected];

  if (
    situation_type === "non_return" &&
    intake.free_text_context &&
    DELAY_KEYWORDS.test(intake.free_text_context)
  ) {
    situation_type = "partial_delay";
  }

  return {
    situation_type,
    confidence: 1.0,
    claim_value_inr: intake.deposit_paid_inr,
    reasoning: `User selected '${intake.situation_type_user_selected}'; vacated ${intake.days_since_vacation} days ago; ₹${intake.deposit_paid_inr.toLocaleString("en-IN")} deposit remains unrecovered.`,
  };
}
