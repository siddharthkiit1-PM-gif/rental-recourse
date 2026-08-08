import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Single source of truth so the UI banner never drifts from the enforced
// limit. Change here and the intake copy updates too.
export const DRAFT_RATELIMIT_PER_IP = 30;
export const DRAFT_RATELIMIT_WINDOW = "24 h" as const;

let _rl: Ratelimit | null = null;

export function draftRatelimit(): Ratelimit {
  if (_rl) return _rl;
  _rl = new Ratelimit({
    redis: redis(),
    // 30/day is generous enough for a user drafting, rejecting, tweaking
    // intake, redrafting — without being an abuse vector for a free tool.
    limiter: Ratelimit.slidingWindow(
      DRAFT_RATELIMIT_PER_IP,
      DRAFT_RATELIMIT_WINDOW,
    ),
    analytics: true,
    prefix: "recourse:rl:draft",
  });
  return _rl;
}
