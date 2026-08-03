import { describe, it, expect } from "vitest";
import { verifyCitations } from "@/lib/agent/verify";
import type { RetrievedChunk } from "@/lib/agent/retrieve";

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
});
