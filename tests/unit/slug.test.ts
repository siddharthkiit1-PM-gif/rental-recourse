import { describe, it, expect } from "vitest";
import { actSlug } from "@/lib/util/slug";

describe("actSlug", () => {
  it("lowercases and underscores", () => {
    expect(actSlug("Karnataka Rent Act, 2001")).toBe("karnataka_rent_act_2001");
  });
  it("strips punctuation, collapses spaces", () => {
    expect(actSlug("Code of Civil Procedure, 1908 (Sec. 80)")).toBe("code_of_civil_procedure_1908_sec_80");
  });
  it("removes leading/trailing underscores", () => {
    expect(actSlug(" Consumer Protection Act, 2019 ")).toBe("consumer_protection_act_2019");
  });
});
