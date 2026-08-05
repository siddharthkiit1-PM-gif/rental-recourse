export const CORPUS_VERSION = "v1" as const;

/**
 * Each act declares one or more retrieval sources. The fetcher tries them
 * in order and uses the first that yields the required sections.
 *
 * - `indiankanoon_doc_id`: numeric — fetches https://indiankanoon.org/doc/<id>/
 *   and parses `<section class="akn-section" id="section_N">` blocks.
 * - `pdf_url`: absolute — downloads and extracts text via pdfjs-dist,
 *   then splits on section headers.
 */
export const ACTS = {
  KARNATAKA_RENT_ACT_2001: {
    name: "Karnataka Rent Act, 2001",
    aliases: ["Karnataka Rent Act, 1999", "Karnataka Act No. 34 of 2001"],
    file: "karnataka-rent-act-2001.md",
    sections: ["9", "12", "27", "30", "34"],
    state_scope: ["Karnataka"],
    source_url: "https://prsindia.org/files/bills_acts/acts_states/karnataka/2001/2001KR34.pdf",
    pdf_url: "https://prsindia.org/files/bills_acts/acts_states/karnataka/2001/2001KR34.pdf",
  },
  MODEL_TENANCY_ACT_2021: {
    name: "Model Tenancy Act, 2021",
    aliases: [],
    file: "model-tenancy-act-2021.md",
    sections: ["11", "12", "21", "32"],
    state_scope: ["Andhra Pradesh", "Tamil Nadu", "Uttar Pradesh", "Assam"],
    source_url:
      "https://web.archive.org/web/2026/https://mohua.gov.in/upload/uploadfiles/files/Model-Tenancy-Act-English-02_06_2021.pdf",
    // MoHUA's live URL 404s; Wayback holds a stable snapshot.
    pdf_url:
      "https://web.archive.org/web/20260515112322if_/https://mohua.gov.in/upload/uploadfiles/files/Model-Tenancy-Act-English-02_06_2021.pdf",
  },
  MAHARASHTRA_RENT_CONTROL_ACT_1999: {
    name: "Maharashtra Rent Control Act, 1999",
    aliases: ["Maharashtra Act No. XVIII of 2000"],
    file: "maharashtra-rent-control-act-1999.md",
    sections: ["7", "24", "33", "55"],
    state_scope: ["Maharashtra"],
    source_url: "https://indiankanoon.org/doc/183192021/",
    indiankanoon_doc_id: 183192021,
  },
  CONSUMER_PROTECTION_ACT_2019: {
    name: "Consumer Protection Act, 2019",
    aliases: ["Act No. 35 of 2019"],
    file: "consumer-protection-act-2019.md",
    sections: ["2(7)", "2(11)", "2(42)", "35", "38"],
    state_scope: ["*"],
    source_url: "https://indiankanoon.org/doc/48103131/",
    indiankanoon_doc_id: 48103131,
  },
  INDIAN_CONTRACT_ACT_1872_SEC_74: {
    name: "Indian Contract Act, 1872",
    aliases: ["Act No. 9 of 1872"],
    file: "indian-contract-act-1872-sec-74.md",
    sections: ["74"],
    state_scope: ["*"],
    source_url: "https://indiankanoon.org/doc/171398/",
    indiankanoon_doc_id: 171398,
  },
  CPC_1908_SEC_80: {
    name: "Code of Civil Procedure, 1908",
    aliases: ["Act No. 5 of 1908"],
    file: "cpc-1908-sec-80.md",
    sections: ["80"],
    state_scope: ["*"],
    source_url: "https://indiankanoon.org/doc/161831507/",
    indiankanoon_doc_id: 161831507,
  },
} as const;

export const MTA_ADOPTED_STATES = new Set([
  "Andhra Pradesh",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Assam",
]);

export const V1_STATES = new Set(["Karnataka", "Maharashtra", ...MTA_ADOPTED_STATES]);

export type ActKey = keyof typeof ACTS;
