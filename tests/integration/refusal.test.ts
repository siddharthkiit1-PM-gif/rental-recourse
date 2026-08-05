import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/agent/classify", () => ({
  classify: vi.fn(async () => ({
    situation_type: "non_return",
    confidence: 0.9,
    claim_value_inr: 95000,
    reasoning: "…",
  })),
}));
vi.mock("@/lib/agent/retrieve", () => ({ retrieve: vi.fn(async () => []) }));
vi.mock("@/lib/agent/draft", () => ({
  draftNotice: vi.fn(async () => ({ draft_text: "…", citations: [] })),
}));

import { runAgent } from "@/lib/agent/orchestrator";
import type { IntakePayload } from "@/lib/agent/types";

const BASE: IntakePayload = {
  tenant_name: "Ravi Kumar",
  tenant_address: "12/3 MG Road, Bangalore 560001",
  landlord_name: "S. Rao",
  landlord_address: "7 Palm Grove, Indiranagar, Bangalore 560038",
  property_address: "Flat 4B, Rose Villa, Koramangala 4th Block, Bangalore 560095",
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

function captureEvents() {
  const events: Array<{ type: string; data?: unknown }> = [];
  const writer = { write: (e: { type: string; data?: unknown }) => events.push(e) };
  return { events, writer };
}

describe("refusal flows", () => {
  it("TC-R-01: commercial premises in free text → refuse before classify", async () => {
    const intake: IntakePayload = {
      ...BASE,
      free_text_context: "I ran a shop from this premises, landlord kept my deposit.",
    };
    const { events, writer } = captureEvents();
    const r = await runAgent(intake, "s1", writer);
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error).toBe("commercial lease");
    expect(events[0].type).toBe("data-error");
  });

  it("TC-E-03: tenancy_end in the future → refuse", async () => {
    const intake: IntakePayload = { ...BASE, tenancy_end: "2099-01-01" };
    const { events, writer } = captureEvents();
    const r = await runAgent(intake, "s2", writer);
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error).toBe("current tenant");
    expect(events[0].type).toBe("data-error");
  });
});
