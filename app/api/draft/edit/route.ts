import { getSession, saveSession } from "@/lib/session/redis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as { session_id?: unknown; edited_draft?: unknown };
  if (typeof body.session_id !== "string" || typeof body.edited_draft !== "string") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  if (body.edited_draft.length > 20_000) {
    return Response.json({ error: "too long" }, { status: 400 });
  }
  const s = await getSession(body.session_id);
  if (!s) return Response.json({ error: "session expired" }, { status: 404 });
  await saveSession({ ...s, edited_draft: body.edited_draft });
  return Response.json({ ok: true });
}
