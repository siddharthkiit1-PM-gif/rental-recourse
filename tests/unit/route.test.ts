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

  it("TC-C-05 Bihar (out-of-scope state) → consumer_commission with limitation flag", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Bihar",
      city: "Patna",
    });
    expect(r.limitation_flag).toMatch(/Bihar/);
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

  it("TC-C-07 Delhi → rent_court under DRCA 1958", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Delhi",
      city: "New Delhi",
    });
    expect(r.primary_forum).toBe("rent_court");
    expect(r.jurisdiction).toMatch(/Delhi Rent Control Act, 1958/);
    expect(r.limitation_flag).toBeNull();
  });

  it("TC-C-08 Tamil Nadu → rent_authority under TN 2017 Act", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Tamil Nadu",
      city: "Chennai",
    });
    expect(r.primary_forum).toBe("rent_authority");
    expect(r.jurisdiction).toMatch(/2017/);
  });

  it("TC-C-09 Telangana → rent_court under Telangana 1960 Act", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Telangana",
      city: "Hyderabad",
    });
    expect(r.primary_forum).toBe("rent_court");
    expect(r.jurisdiction).toMatch(/Telangana Buildings/);
  });

  it("TC-C-10 West Bengal → rent_court under WBPTA 1997", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "West Bengal",
      city: "Kolkata",
    });
    expect(r.primary_forum).toBe("rent_court");
    expect(r.jurisdiction).toMatch(/West Bengal Premises Tenancy Act, 1997/);
  });

  it("TC-C-11 Rajasthan → rent_authority under Rajasthan RCA 2001", () => {
    const r = routeForum({
      situation_type: "non_return",
      claim_value_inr: 95_000,
      state: "Rajasthan",
      city: "Jaipur",
    });
    expect(r.primary_forum).toBe("rent_authority");
    expect(r.jurisdiction).toMatch(/Rajasthan Rent Control Act, 2001/);
    expect(r.limitation_flag).toBeNull();
  });
});
