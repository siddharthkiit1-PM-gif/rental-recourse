import { getSession } from "@/lib/session/redis";
import { renderNoticePdf } from "@/lib/pdf/notice";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as { session_id?: unknown };
  if (typeof body.session_id !== "string") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const s = await getSession(body.session_id);
  if (!s) return Response.json({ error: "session expired" }, { status: 404 });
  if (!s.draft) return Response.json({ error: "no draft yet" }, { status: 404 });

  const text = s.edited_draft ?? s.draft.draft_text;
  const pdf = await renderNoticePdf({
    body: text,
    citations: s.draft.citations,
    generated_at: new Date().toISOString(),
  });

  return new Response(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="recourse-legal-notice-${s.session_id}.pdf"`,
    },
  });
}
