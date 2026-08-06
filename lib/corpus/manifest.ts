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
  DELHI_RENT_CONTROL_ACT_1958: {
    name: "Delhi Rent Control Act, 1958",
    aliases: ["Act No. 59 of 1958"],
    file: "delhi-rent-control-act-1958.md",
    // s.4 fair rent, s.6 standard rent, s.14 grounds for eviction,
    // s.27 tenant's deposit-of-rent remedy when landlord refuses,
    // s.50 jurisdiction of the Rent Controller.
    sections: ["4", "6", "14", "27", "50"],
    state_scope: ["Delhi"],
    source_url: "https://indiankanoon.org/doc/152548910/",
    indiankanoon_doc_id: 152548910,
  },
  TAMIL_NADU_RRLT_ACT_2017: {
    name: "Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017",
    aliases: ["TN Act 42 of 2017", "TNRRRLT Act, 2017"],
    file: "tamil-nadu-rrlt-act-2017.md",
    // s.4 registration of tenancy, s.6 security deposit (residential cap
    // = 3 months rent; refund on vacating), s.21 Rent Authority powers,
    // s.30 Rent Court jurisdiction.
    sections: ["4", "6", "21", "30"],
    state_scope: ["Tamil Nadu"],
    source_url: "https://indiankanoon.org/doc/134441806/",
    indiankanoon_doc_id: 134441806,
  },
  TELANGANA_BUILDINGS_ACT_1960: {
    name: "Telangana Buildings (Lease, Rent and Eviction) Control Act, 1960",
    aliases: ["Andhra Pradesh Buildings Act, 1960 (adapted)", "Act 15 of 1960"],
    file: "telangana-buildings-act-1960.md",
    // s.4 fair rent, s.8 rent receipt, s.9 deposit of rent when landlord
    // refuses, s.10 eviction, s.15 Rent Controller.
    sections: ["4", "8", "9", "10", "15"],
    state_scope: ["Telangana"],
    source_url:
      "https://www.indiacode.nic.in/bitstream/123456789/8607/1/act_15_of_1960.pdf",
    pdf_url:
      "https://www.indiacode.nic.in/bitstream/123456789/8607/1/act_15_of_1960.pdf",
  },
  WEST_BENGAL_PREMISES_TENANCY_ACT_1997: {
    name: "West Bengal Premises Tenancy Act, 1997",
    aliases: ["West Bengal Act XXXVII of 1997"],
    file: "west-bengal-premises-tenancy-act-1997.md",
    // s.6 grounds for recovery of possession, s.7 rent during proceedings,
    // s.17 fair rent, s.21 deposit of rent with Rent Controller, s.26
    // sub-tenancy notification.
    sections: ["6", "7", "17", "21", "26"],
    state_scope: ["West Bengal"],
    source_url: "https://indiankanoon.org/doc/140761342/",
    indiankanoon_doc_id: 140761342,
  },
  RAJASTHAN_RENT_CONTROL_ACT_2001: {
    name: "Rajasthan Rent Control Act, 2001",
    aliases: ["Rajasthan Act No. 1 of 2003"],
    file: "rajasthan-rent-control-act-2001.md",
    // s.9 rent payment/tender, s.10 grounds for eviction, s.13 Rent
    // Tribunal, s.22 procedure before Tribunal.
    sections: ["9", "10", "13", "22"],
    state_scope: ["Rajasthan"],
    source_url: "https://indiankanoon.org/doc/18783076/",
    indiankanoon_doc_id: 18783076,
  },
} as const;

export const MTA_ADOPTED_STATES = new Set([
  "Andhra Pradesh",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Assam",
]);

/**
 * States where routing has a dedicated Rent Authority / Rent Controller /
 * Rent Tribunal — routeForum() prefers that forum over the pan-India
 * consumer commission fallback.
 */
export const DEDICATED_RENT_FORUM_STATES = new Set([
  "Delhi",
  "Tamil Nadu",
  "Telangana",
  "West Bengal",
  "Rajasthan",
]);

export const V1_STATES = new Set([
  "Karnataka",
  "Maharashtra",
  ...MTA_ADOPTED_STATES,
  ...DEDICATED_RENT_FORUM_STATES,
]);

export type ActKey = keyof typeof ACTS;
