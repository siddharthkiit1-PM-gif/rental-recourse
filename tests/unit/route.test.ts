import { describe, it, expect } from "vitest";
import { routeForum } from "@/lib/agent/route";

describe("routeForum matrix", () => {
  it("TC-C-01 KA non_return → legal_notice + consumer_commission", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Karnataka",
      city: "Bangalore",
    });
    expect(r.primary_forum).toBe("legal_notice");
    expect(r.secondary_forum).toBe("consumer_commission");
    expect(r.jurisdiction).toContain("Bangalore");
  });

  it("TC-C-03 landlord unreachable + ₹2L → adds police_complaint", () => {
    const r = routeForum({
      situation_type: "landlord_unreachable",
      claim_value_inr: 200_000,
      state: "Karnataka",
      city: "Bangalore",
    });
    expect([r.primary_forum, r.secondary_forum]).toContain("police_complaint");
  });

  it("TC-C-04 ₹80L → civil_suit + limitation_flag", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 80_00_000,
      state: "Karnataka",
      city: "Bangalore",
    });
    expect(r.primary_forum).toBe("civil_suit");
    expect(r.limitation_flag).toBeTruthy();
  });

  it("TC-C-05 Rajasthan → out_of_scope with limitation flag", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Rajasthan",
      city: "Jaipur",
    });
    expect(r.limitation_flag).toMatch(/Rajasthan/);
    expect(r.primary_forum).toBe("consumer_commission");
  });

  it("TC-C-06 Andhra Pradesh → rent_authority primary", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Andhra Pradesh",
      city: "Hyderabad",
    });
    expect(r.primary_forum).toBe("rent_authority");
  });
});
