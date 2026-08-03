import { Redis } from "@upstash/redis";
import type {
  IntakePayload,
  ClassificationResult,
  ForumResult,
  EvidenceChecklist,
  DraftResult,
} from "@/lib/agent/types";

let _redis: Redis | null = null;

export function redis(): Redis {
  if (_redis) return _redis;
  _redis = Redis.fromEnv();
  return _redis;
}

export type Session = {
  session_id: string;
  created_at: number;
  intake?: IntakePayload;
  classification?: ClassificationResult;
  forum?: ForumResult;
  checklist?: EvidenceChecklist;
  draft?: DraftResult;
  edited_draft?: string;
  feedback?: { rating: 1 | 2 | 3 | 4 | 5; timestamp: number };
};

const key = (id: string) => `recourse:session:${id}`;
const TTL_SECONDS = 24 * 60 * 60;

export async function getSession(id: string): Promise<Session | null> {
  return (await redis().get<Session>(key(id))) ?? null;
}

export async function saveSession(s: Session): Promise<void> {
  await redis().set(key(s.session_id), s, { ex: TTL_SECONDS });
}
