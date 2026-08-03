import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/agent/classify", () => ({
  classify: vi.fn(async () => ({
    situation_type: "non_return",
    confidence: 0.9,
    claim_value_inr: 95000,
    reasoning: "Landlord has not returned any of the ₹95,000 deposit paid.",
  })),
}));

vi.mock("@/lib/agent/retrieve", () => ({
  retrieve: vi.fn(async () => [
    {
      id: "karnataka_rent_act_2001__sec_12__v1",
      score: 0.9,
      text: "…",
      act_name: "Karnataka Rent Act, 2001",
      section_number: "12",
      state_scope: ["Karnataka"],
      subject_tags: [],
      source_url: "",
    },
    {
      id: "consumer_protection_act_2019__sec_2_11__v1",
      score: 0.9,
      text: "…",
      act_name: "Consumer Protection Act, 2019",
      section_number: "2(11)",
      state_scope: ["*"],
      subject_tags: [],
      source_url: "",
    },
    {
      id: "code_of_civil_procedure_1908__sec_80__v1",
      score: 0.9,
      text: "…",
      act_name: "Code of Civil Procedure, 1908",
      section_number: "80",
      state_scope: ["*"],
      subject_tags: [],
      source_url: "",
    },
  ]),
}));

vi.mock("@/lib/agent/draft", () => ({
  draftNotice: vi.fn(async () => ({
    draft_text:
      "LEGAL NOTICE. Under Section 80 of the Code of Civil Procedure, 1908. My client, having vacated the premises, invokes Section 12 of the Karnataka Rent Act, 2001 and Section 2(11) of the Consumer Protection Act, 2019 to demand refund of ₹95,000.".padEnd(
        400,
        " ",
      ),
    citations: [
      {
        act: "Karnataka Rent Act, 2001",
        section: "12",
        chunk_id: "karnataka_rent_act_2001__sec_12__v1",
      },
      {
        act: "Consumer Protection Act, 2019",
        section: "2(11)",
        chunk_id: "consumer_protection_act_2019__sec_2_11__v1",
      },
      {
        act: "Code of Civil Procedure, 1908",
        section: "80",
        chunk_id: "code_of_civil_procedure_1908__sec_80__v1",
      },
    ],
  })),
}));

import { runAgent } from "@/lib/agent/orchestrator";
import type { IntakePayload } from "@/lib/agent/types";

const intake: IntakePayload = {
  state: "Karnataka",
  city: "Bangalore",
  monthly_rent_inr: 35000,
  deposit_paid_inr: 95000,
  tenancy_start: "2024-01-15",
  tenancy_end: "2025-06-30",
  situation_type_user_selected: "not_returned",
  days_since_vacation: 45,
  last_communication_date: "2025-07-10",
  evidence_available: ["rent_agreement", "bank_transfer_proof", "whatsapp_email"],
  free_text_context: null,
};

describe("agent loop (integration, mocked LLMs)", () => {
  it("streams the 5 step events then complete", async () => {
    const events: Array<{ type: string }> = [];
    const writer = { write: (e: { type: string }) => events.push(e) };
    const r = await runAgent(intake, "sess_1", writer);
    expect("draft" in r).toBe(true);
    const types = events.map((e) => e.type);
    for (const t of [
      "data-classified",
      "data-routed",
      "data-retrieved",
      "data-checklist",
      "data-drafting",
      "data-verified",
      "data-complete",
    ]) {
      expect(types).toContain(t);
    }
  });

  it("refuses when tenancy_end is in the future", async () => {
    const future: IntakePayload = { ...intake, tenancy_end: "2099-01-01" };
    const events: Array<{ type: string; data?: unknown }> = [];
    const writer = { write: (e: { type: string; data?: unknown }) => events.push(e) };
    const r = await runAgent(future, "sess_2", writer);
    expect("error" in r).toBe(true);
    expect(events.some((e) => e.type === "data-error")).toBe(true);
  });
});
