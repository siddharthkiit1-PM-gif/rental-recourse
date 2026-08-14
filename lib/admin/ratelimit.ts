import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/session/redis";

let _req: Ratelimit | null = null;
let _verify: Ratelimit | null = null;

export function magicRequestLimit(): Ratelimit {
  if (_req) return _req;
  _req = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "recourse:rl:magic-req",
  });
  return _req;
}

export function magicVerifyLimit(): Ratelimit {
  if (_verify) return _verify;
  _verify = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "recourse:rl:magic-verify",
  });
  return _verify;
}
