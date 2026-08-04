import { NextRequest } from "next/server";
import { getSession } from "@/lib/session/redis";
import { renderNoticePdf } from "@/lib/pdf/notice";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });
  const s = await getSession(id);
  if (!s) return new Response("session expired", { status: 404 });
  if (!s.draft) return new Response("no draft yet", { status: 404 });

  const text = s.edited_draft ?? s.draft.draft_text;
  const buf = await renderNoticePdf({
    body: text,
    citations: s.draft.citations,
    generated_at: new Date().toISOString(),
  });

  const filename = `Legal_Notice_Deposit_${new Date().toISOString().slice(0, 10)}.pdf`;
  return new Response(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
