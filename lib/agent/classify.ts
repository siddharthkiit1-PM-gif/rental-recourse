import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { ClassificationResult, type IntakePayload } from "./types";
import { SAFETY_HEADER, CLASSIFY_INSTRUCTIONS } from "./prompts";

export async function classify(intake: IntakePayload): Promise<ClassificationResult> {
  const prompt = `${SAFETY_HEADER}

${CLASSIFY_INSTRUCTIONS}

Intake:
State: ${intake.state}, City: ${intake.city}
Rent: ₹${intake.monthly_rent_inr}/month
Deposit paid: ₹${intake.deposit_paid_inr}
Tenancy: ${intake.tenancy_start} to ${intake.tenancy_end}
Days since vacation: ${intake.days_since_vacation}
User-selected situation: ${intake.situation_type_user_selected}
Evidence available: ${intake.evidence_available.join(", ") || "none"}
Free text: ${intake.free_text_context ?? "(none)"}
`;
  const { object } = await generateObject({
    model: google("gemini-2.5-pro"),
    schema: ClassificationResult,
    prompt,
    temperature: 0.2,
  });
  return object;
}
