export const CORPUS_VERSION = "v1" as const;

export const ACTS = {
  KARNATAKA_RENT_ACT_2001: {
    name: "Karnataka Rent Act, 2001",
    aliases: ["Karnataka Rent Act, 1999", "Karnataka Act No. 34 of 2001"],
    file: "karnataka-rent-act-2001.md",
    sections: ["9", "12", "27", "30", "34"],
    state_scope: ["Karnataka"],
    source_url: "https://www.indiacode.nic.in/handle/123456789/7810",
  },
  MODEL_TENANCY_ACT_2021: {
    name: "Model Tenancy Act, 2021",
    aliases: [],
    file: "model-tenancy-act-2021.md",
    sections: ["11", "12", "21", "32"],
    state_scope: ["Andhra Pradesh", "Tamil Nadu", "Uttar Pradesh", "Assam"],
    source_url: "https://mohua.gov.in/cms/model-tenancy-act.php",
  },
  MAHARASHTRA_RENT_CONTROL_ACT_1999: {
    name: "Maharashtra Rent Control Act, 1999",
    aliases: ["Maharashtra Act No. XVIII of 2000"],
    file: "maharashtra-rent-control-act-1999.md",
    sections: ["7", "24", "33", "55"],
    state_scope: ["Maharashtra"],
    source_url: "https://www.indiacode.nic.in/handle/123456789/15817",
  },
  CONSUMER_PROTECTION_ACT_2019: {
    name: "Consumer Protection Act, 2019",
    aliases: ["Act No. 35 of 2019"],
    file: "consumer-protection-act-2019.md",
    sections: ["2(7)", "2(11)", "2(42)", "35", "38"],
    state_scope: ["*"],
    source_url: "https://www.indiacode.nic.in/handle/123456789/16103",
  },
  INDIAN_CONTRACT_ACT_1872_SEC_74: {
    name: "Indian Contract Act, 1872",
    aliases: ["Act No. 9 of 1872"],
    file: "indian-contract-act-1872-sec-74.md",
    sections: ["74"],
    state_scope: ["*"],
    source_url: "https://www.indiacode.nic.in/handle/123456789/2187",
  },
  CPC_1908_SEC_80: {
    name: "Code of Civil Procedure, 1908",
    aliases: ["Act No. 5 of 1908"],
    file: "cpc-1908-sec-80.md",
    sections: ["80"],
    state_scope: ["*"],
    source_url: "https://www.indiacode.nic.in/handle/123456789/2191",
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
