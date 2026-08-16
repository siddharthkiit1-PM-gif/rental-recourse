import { getSession, saveSession } from "@/lib/session/redis";
import { incrDailyQuiet } from "@/lib/admin/counters";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { session_id?: unknown; rating?: unknown };
  if (typeof body.session_id !== "string" || ![1, 2, 3, 4, 5].includes(body.rating as number)) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const s = await getSession(body.session_id);
  if (!s) return Response.json({ error: "session expired" }, { status: 404 });
  const rating = body.rating as 1 | 2 | 3 | 4 | 5;
  await saveSession({ ...s, feedback: { rating, timestamp: Date.now() } });
  await incrDailyQuiet("ratings_total");
  if (rating === 5) await incrDailyQuiet("rating_5");
  return Response.json({ ok: true });
}
