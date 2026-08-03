import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

let _rl: Ratelimit | null = null;

export function draftRatelimit(): Ratelimit {
  if (_rl) return _rl;
  _rl = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(10, "24 h"),
    analytics: true,
    prefix: "recourse:rl:draft",
  });
  return _rl;
}
