import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

let _rl: Ratelimit | null = null;

export function draftRatelimit(): Ratelimit {
  if (_rl) return _rl;
  _rl = new Ratelimit({
    redis: redis(),
    // 30/day is generous enough for a user drafting, rejecting, tweaking
    // intake, redrafting — without being an abuse vector for a free tool.
    limiter: Ratelimit.slidingWindow(30, "24 h"),
    analytics: true,
    prefix: "recourse:rl:draft",
  });
  return _rl;
}
