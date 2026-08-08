import { describe, it, expect } from "vitest";
import { verifyCitations } from "@/lib/agent/verify";
import type { RetrievedChunk } from "@/lib/agent/retrieve";
import { DraftResult } from "@/lib/agent/types";

describe("DraftResult schema", () => {
  it("rejects drafts shorter than 1500 chars (was 300 — too small)", () => {
    const tooShort = "L".repeat(1499);
    const r = DraftResult.safeParse({ draft_text: tooShort, citations: [] });
    expect(r.success).toBe(false);
  });

  it("accepts drafts at or above 1500 chars", () => {
    const ok = "L".repeat(1500);
    const r = DraftResult.safeParse({ draft_text: ok, citations: [] });
    expect(r.success).toBe(true);
  });
});

const chunks: RetrievedChunk[] = [
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
];

describe("verifyCitations", () => {
  it("TC-G-01: all citations exist in retrieved chunks → verified", () => {
    const r = verifyCitations({
      draft_text:
        "…as per Section 12 of the Karnataka Rent Act, 2001 and Section 2(11) of the Consumer Protection Act, 2019.",
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
      ],
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(true);
    expect(r.unverified).toEqual([]);
  });

  it("TC-G-01: citation to section not in chunks → unverified", () => {
    const r = verifyCitations({
      draft_text: "Section 99 of the Karnataka Rent Act, 2001 says…",
      citations: [
        { act: "Karnataka Rent Act, 2001", section: "99", chunk_id: "fake" },
      ],
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
  });

  it("TC-G-03: cite MRCA for Karnataka user → unverified", () => {
    const mrca: RetrievedChunk = {
      id: "mrca__sec_55__v1",
      score: 0.7,
      text: "…",
      act_name: "Maharashtra Rent Control Act, 1999",
      section_number: "55",
      state_scope: ["Maharashtra"],
      subject_tags: [],
      source_url: "",
    };
    const r = verifyCitations({
      draft_text: "Section 55 of the Maharashtra Rent Control Act, 1999…",
      citations: [
        {
          act: "Maharashtra Rent Control Act, 1999",
          section: "55",
          chunk_id: "mrca__sec_55__v1",
        },
      ],
      chunks: [...chunks, mrca],
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
    expect(r.unverified[0].reason).toMatch(/state/i);
  });

  it("TC-G-05: no invented case-law references (regex over draft text)", () => {
    const r = verifyCitations({
      draft_text: "As held in Kesavananda Bharati v. State of Kerala (1973)…",
      citations: [],
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
  });

  it("TC-G-06: draft text mentions Section X but not in citations[] → unverified", () => {
    const r = verifyCitations({
      draft_text: "Section 74 of the Indian Contract Act, 1872 applies here.",
      citations: [],
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
  });

  it("TC-G-08: catches 'Sec. N' surface form the old regex missed", () => {
    const r = verifyCitations({
      draft_text: "Under Sec. 47 of the Karnataka Rent Act, 2001 the tenant demands…",
      citations: [], // section 47 is hallucinated, not declared
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
  });

  it("TC-G-09: catches 's. N' surface form", () => {
    const r = verifyCitations({
      draft_text: "As per s. 12 of the Karnataka Rent Act, 2001, refund is due.",
      citations: [], // section 12 mentioned but not declared
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
  });

  it("TC-G-10: 'Section N' bare (no 'of the Act') still flagged if section not in any declared citation", () => {
    const r = verifyCitations({
      draft_text: "The tenant invokes Section 99 in this matter.",
      citations: [
        { act: "Karnataka Rent Act, 2001", section: "12", chunk_id: "karnataka_rent_act_2001__sec_12__v1" },
      ],
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(false);
  });

  it("TC-G-11: bare 'Section 12' passes when 12 is in a declared citation", () => {
    const r = verifyCitations({
      draft_text:
        "The tenant invokes Section 12 (which is fully described in the reference block).",
      citations: [
        { act: "Karnataka Rent Act, 2001", section: "12", chunk_id: "karnataka_rent_act_2001__sec_12__v1" },
      ],
      chunks,
      user_state: "Karnataka",
    });
    expect(r.verified).toBe(true);
  });
});
