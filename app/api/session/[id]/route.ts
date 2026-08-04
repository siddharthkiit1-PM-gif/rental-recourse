import { getSession } from "@/lib/session/redis";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const s = await getSession(id);
  if (!s) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(s);
}
