import { describe, it, expect } from "vitest";
import { sanitizeForbidden, containsForbidden } from "@/lib/safety/forbidden";

describe("forbidden terms filter", () => {
  it("flags 'legal advice'", () =>
    expect(containsForbidden("This is legal advice")).toEqual(["legal advice"]));

  it("flags 'attorney', 'lawyer', 'counsel'", () => {
    expect(containsForbidden("consult an attorney")).toContain("attorney");
    expect(containsForbidden("hire a lawyer")).toContain("lawyer");
    expect(containsForbidden("with counsel")).toContain("counsel");
  });

  it("does NOT flag 'legal notice'", () =>
    expect(containsForbidden("This legal notice is served")).toEqual([]));

  it("case-insensitive", () =>
    expect(containsForbidden("LEGAL ADVICE")).toContain("legal advice"));

  it("sanitize replaces with neutral phrasing", () => {
    expect(sanitizeForbidden("consult a lawyer")).toBe("consult a professional");
    expect(sanitizeForbidden("legal advice from an attorney")).toBe(
      "informational guidance from a professional",
    );
  });
});
