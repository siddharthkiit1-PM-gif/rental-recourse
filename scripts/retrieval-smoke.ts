import { config } from "dotenv";
config({ path: ".env.local" });

import { retrieve } from "../lib/agent/retrieve";

type Case = {
  name: string;
  state: string;
  query: string;
  subject_tags?: string[];
  must_include_act: string;
  must_include_section: string;
};

const CASES: Case[] = [
  {
    name: "KA deposit non-return",
    state: "Karnataka",
    query: "landlord not returning security deposit 45 days after vacating",
    subject_tags: ["deposit_refund"],
    must_include_act: "Karnataka Rent Act, 2001",
    must_include_section: "12",
  },
  {
    name: "MH vague deductions",
    state: "Maharashtra",
    query: "landlord deducted ₹40,000 for painting no receipts",
    must_include_act: "Maharashtra Rent Control Act, 1999",
    must_include_section: "55",
  },
  {
    name: "CPA deficiency of service",
    state: "Karnataka",
    query: "deficiency of service consumer complaint jurisdiction",
    subject_tags: ["consumer_commission", "definitions"],
    must_include_act: "Consumer Protection Act, 2019",
    must_include_section: "2(11)",
  },
  {
    name: "CPC section 80 notice",
    state: "Karnataka",
    query: "format of legal notice pre-litigation",
    subject_tags: ["legal_notice_format"],
    must_include_act: "Code of Civil Procedure, 1908",
    must_include_section: "80",
  },
  {
    name: "Contract Act penalty",
    state: "Karnataka",
    query: "forfeiture of deposit as penalty compensation",
    subject_tags: ["penalty_clause"],
    must_include_act: "Indian Contract Act, 1872",
    must_include_section: "74",
  },
  {
    name: "MTA deposit cap for AP",
    state: "Andhra Pradesh",
    query: "maximum security deposit residential tenancy",
    subject_tags: ["deposit_cap", "deposit_refund"],
    must_include_act: "Model Tenancy Act, 2021",
    must_include_section: "11",
  },
  {
    name: "MTA rent authority for UP",
    state: "Uttar Pradesh",
    query: "rent authority dispute resolution",
    subject_tags: ["forum"],
    must_include_act: "Model Tenancy Act, 2021",
    must_include_section: "21",
  },
  {
    name: "KA tribunal jurisdiction",
    state: "Karnataka",
    query: "rent controller tribunal jurisdiction",
    subject_tags: ["forum"],
    must_include_act: "Karnataka Rent Act, 2001",
    must_include_section: "30",
  },
  {
    name: "CPA complaint procedure",
    state: "Maharashtra",
    query: "how to file consumer complaint district commission",
    subject_tags: ["complaint_procedure"],
    must_include_act: "Consumer Protection Act, 2019",
    must_include_section: "35",
  },
  {
    name: "CPA district commission jurisdiction",
    state: "Karnataka",
    query: "consumer commission pecuniary jurisdiction limit",
    subject_tags: ["complaint_procedure"],
    must_include_act: "Consumer Protection Act, 2019",
    must_include_section: "38",
  },
  {
    name: "Delhi standard rent recovery",
    state: "Delhi",
    query: "landlord demanding rent above standard rent Delhi",
    must_include_act: "Delhi Rent Control Act, 1958",
    must_include_section: "4",
  },
  {
    name: "TN tenancy registration",
    state: "Tamil Nadu",
    query: "tenancy agreement must be registered with rent authority Tamil Nadu",
    must_include_act:
      "Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017",
    must_include_section: "4",
  },
  {
    name: "Telangana deposit of rent with controller",
    state: "Telangana",
    query: "tenant deposit rent with Rent Controller landlord refuses to accept Telangana",
    must_include_act:
      "Telangana Buildings (Lease, Rent and Eviction) Control Act, 1960",
    must_include_section: "9",
  },
  {
    name: "WB rent controller deposit",
    state: "West Bengal",
    query: "deposit rent with Rent Controller when landlord refuses West Bengal",
    must_include_act: "West Bengal Premises Tenancy Act, 1997",
    must_include_section: "21",
  },
  {
    name: "Rajasthan Rent Tribunal jurisdiction",
    state: "Rajasthan",
    query: "Rent Tribunal jurisdiction landlord tenant dispute Rajasthan",
    must_include_act: "Rajasthan Rent Control Act, 2001",
    must_include_section: "13",
  },
];

async function main() {
  let pass = 0,
    fail = 0;
  for (const c of CASES) {
    const results = await retrieve({
      query: c.query,
      state: c.state,
      subject_tags: c.subject_tags,
      topK: 5,
    });
    const hit = results.some(
      (r) => r.act_name === c.must_include_act && r.section_number === c.must_include_section,
    );
    if (hit) {
      console.log(`✓ ${c.name}`);
      pass++;
    } else {
      fail++;
      console.log(`✗ ${c.name} — expected ${c.must_include_act} sec ${c.must_include_section}, got:`);
      for (const r of results)
        console.log(`    - ${r.act_name} sec ${r.section_number} (${r.score.toFixed(3)})`);
    }
  }
  console.log(`\n${pass}/${CASES.length} passed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
