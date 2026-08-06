import { MTA_ADOPTED_STATES, V1_STATES } from "@/lib/corpus/manifest";
import type { ForumResult, ClassificationResult } from "./types";

const CONSUMER_COMMISSION_LIMIT_INR = 50_00_000;
const CIVIL_SUIT_HIGH_COURT_THRESHOLD_INR = 50_00_00_000;

/**
 * States with a dedicated modern rent-forum framework in v1 corpus.
 * Each entry declares which primary forum applies and the jurisdiction
 * string to render in the notice. Overrides the generic legal_notice
 * → consumer_commission fallback.
 */
const DEDICATED_FORUMS: Record<
  string,
  {
    primary_forum: ForumResult["primary_forum"];
    forum_label: string;
    act_cite: string;
  }
> = {
  Delhi: {
    primary_forum: "rent_court",
    forum_label: "Court of the Rent Controller",
    act_cite: "Delhi Rent Control Act, 1958 (s.50)",
  },
  "Tamil Nadu": {
    primary_forum: "rent_authority",
    forum_label: "Rent Authority",
    act_cite:
      "Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017 (ss.21, 30)",
  },
  Telangana: {
    primary_forum: "rent_court",
    forum_label: "Rent Controller",
    act_cite: "Telangana Buildings (Lease, Rent and Eviction) Control Act, 1960 (s.15)",
  },
  "West Bengal": {
    primary_forum: "rent_court",
    forum_label: "Rent Controller",
    act_cite: "West Bengal Premises Tenancy Act, 1997 (s.21)",
  },
  Rajasthan: {
    primary_forum: "rent_authority",
    forum_label: "Rent Authority (with appeal to Rent Tribunal)",
    act_cite: "Rajasthan Rent Control Act, 2001 (ss.13, 22A)",
  },
};

type RouteInput = {
  situation_type: Exclude<ClassificationResult["situation_type"], "ambiguous">;
  claim_value_inr: number;
  state: string;
  city: string;
};

export function routeForum(input: RouteInput): ForumResult {
  const { situation_type, claim_value_inr, state, city } = input;
  const isMTA = MTA_ADOPTED_STATES.has(state);
  const isV1 = V1_STATES.has(state);
  const dedicated = DEDICATED_FORUMS[state];
  const limitationFlags: string[] = [];

  if (!isV1) {
    limitationFlags.push(
      `This tool's v1 corpus does not include ${state}-specific rent law. The draft cites only the pan-India Consumer Protection Act, 2019 and the Indian Contract Act, 1872.`,
    );
  }

  if (claim_value_inr > CONSUMER_COMMISSION_LIMIT_INR) {
    limitationFlags.push(
      `Claim value ₹${claim_value_inr.toLocaleString("en-IN")} exceeds the ₹50L District Consumer Commission limit. A civil suit is recommended; consult a professional.`,
    );
    return {
      primary_forum: "civil_suit",
      secondary_forum: "none",
      jurisdiction:
        claim_value_inr > CIVIL_SUIT_HIGH_COURT_THRESHOLD_INR
          ? "High Court"
          : `Civil Court, ${city}`,
      filing_url: null,
      reasoning: "Claim value exceeds District Consumer Commission pecuniary limit.",
      limitation_flag: limitationFlags.join(" "),
    };
  }

  if (situation_type === "landlord_unreachable" && claim_value_inr >= 50_000) {
    return {
      primary_forum: "legal_notice",
      secondary_forum: "police_complaint",
      jurisdiction: `Police station with territorial jurisdiction (${city})`,
      filing_url: null,
      reasoning:
        "Prolonged non-communication combined with a substantial deposit indicates possible criminal breach of trust (Sec 406 IPC). Legal notice + police complaint recommended.",
      limitation_flag: limitationFlags.length ? limitationFlags.join(" ") : null,
    };
  }

  if (dedicated) {
    return {
      primary_forum: dedicated.primary_forum,
      secondary_forum: "consumer_commission",
      jurisdiction: `${dedicated.forum_label}, ${city} — jurisdiction under the ${dedicated.act_cite}`,
      filing_url: null,
      reasoning: `${state} has a dedicated rent-dispute framework under the ${dedicated.act_cite}; that is the primary forum for this claim, with the District Consumer Commission available as a secondary route for deficiency-of-service claims under CPA 2019.`,
      limitation_flag: null,
    };
  }

  if (isMTA) {
    return {
      primary_forum: "rent_authority",
      secondary_forum: "consumer_commission",
      jurisdiction: `Rent Authority for ${city} (under state's Model Tenancy Act, 2021 implementation)`,
      filing_url: null,
      reasoning: `${state} has adopted the Model Tenancy Act, 2021. The Rent Authority created under the Act is the primary forum for tenancy disputes.`,
      limitation_flag: null,
    };
  }

  const jurisdictionSuffix = state === "Karnataka" ? " Urban" : "";
  const primary_forum: ForumResult["primary_forum"] = isV1 ? "legal_notice" : "consumer_commission";
  return {
    primary_forum,
    secondary_forum: "consumer_commission",
    jurisdiction: `District Consumer Commission, ${city}${jurisdictionSuffix}`,
    filing_url: "https://consumerhelpline.gov.in/e-daakhil.php",
    reasoning:
      "Pre-litigation legal notice is standard practice and often prompts settlement. If ignored, file at the District Consumer Commission (deficiency of service under CPA 2019, Sec 2(11)).",
    limitation_flag: limitationFlags.length ? limitationFlags.join(" ") : null,
  };
}
