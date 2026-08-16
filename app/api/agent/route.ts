import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { runAgent } from "@/lib/agent/orchestrator";
import { IntakePayload } from "@/lib/agent/types";
import { newSessionId } from "@/lib/util/ids";
import { getSession, saveSession } from "@/lib/session/redis";
import { draftRatelimit } from "@/lib/session/ratelimit";
import { incrDailyQuiet } from "@/lib/admin/counters";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const raw = await req.json();
  const parsed = IntakePayload.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "invalid intake", details: parsed.error.flatten() }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await draftRatelimit().limit(ip);
  if (!rl.success) {
    const retry = Math.max(1, Math.floor((rl.reset - Date.now()) / 1000));
    return new Response(JSON.stringify({ error: "rate limited", reset: rl.reset }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": String(retry) },
    });
  }

  const session_id = newSessionId();
  const intake = parsed.data;
  await saveSession({ session_id, created_at: Date.now(), intake });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "data-session", data: { session_id }, transient: true });
      const result = await runAgent(intake, session_id, writer);
      if ("draft" in result) {
        const existing = await getSession(session_id);
        if (existing)
          await saveSession({
            ...existing,
            classification: result.classification,
            forum: result.forum,
            checklist: result.checklist,
            draft: result.draft,
          });
        await incrDailyQuiet("draft_completed");
      }
    },
    onError: (e) => (e as Error).message,
  });

  return createUIMessageStreamResponse({ stream });
}
