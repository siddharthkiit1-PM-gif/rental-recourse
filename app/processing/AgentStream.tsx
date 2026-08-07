"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type StepStatus = "pending" | "active" | "done" | "error";
type Step = { key: string; label: string; status: StepStatus; detail?: string };

const INITIAL_STEPS: Step[] = [
  { key: "classified", label: "Classifying your situation", status: "active" },
  { key: "routed", label: "Selecting the right forum", status: "pending" },
  { key: "retrieved", label: "Retrieving relevant law", status: "pending" },
  { key: "checklist", label: "Building evidence checklist", status: "pending" },
  { key: "drafting", label: "Drafting your notice", status: "pending" },
  { key: "verified", label: "Verifying citations", status: "pending" },
];

function summarize(type: string, data: Record<string, unknown>): string {
  if (type === "data-classified") {
    const conf = (data.confidence as number) ?? 0;
    return `${data.situation_type} (confidence ${(conf * 100).toFixed(0)}%)`;
  }
  if (type === "data-routed") {
    const sec = data.secondary_forum as string;
    return `${data.primary_forum}${sec !== "none" ? " + " + sec : ""} — ${data.jurisdiction}`;
  }
  if (type === "data-retrieved") {
    const chunks = data.chunks as unknown[] | undefined;
    return `${chunks?.length ?? 0} sections`;
  }
  if (type === "data-checklist") {
    const att = (data.attached as unknown[]) ?? [];
    const rec = (data.recommended_additional as unknown[]) ?? [];
    return `${att.length} attached, ${rec.length} recommended`;
  }
  if (type === "data-drafting") return data.progress === "started" ? "…" : "done";
  if (type === "data-verified") {
    const unv = (data.unverified as unknown[]) ?? [];
    return data.verified ? "all citations grounded" : `${unv.length} issue(s), regenerating`;
  }
  return "";
}

export function AgentStream() {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [transportError, setTransportError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const stored = sessionStorage.getItem("recourse:intake");
    if (!stored) {
      router.replace("/intake?reason=expired");
      return;
    }
    const intake = JSON.parse(stored);

    (async () => {
      let res: Response;
      try {
        res = await fetch("/api/agent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(intake),
        });
      } catch {
        setTransportError("Network error — check your connection.");
        return;
      }

      if (res.status === 429) {
        router.replace("/intake?reason=ratelimit");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setTransportError(`Server returned ${res.status}. ${text.slice(0, 200)}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setTransportError("No response stream.");
        return;
      }
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const part = JSON.parse(payload) as { type: string; data?: unknown };
            handleEvent(part);
          } catch {
            // ignore malformed SSE frames
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEvent(part: { type: string; data?: unknown }) {
    const t = part.type;
    const data = (part.data ?? {}) as Record<string, unknown>;
    if (t === "data-session") return;
    if (t === "data-complete") {
      const sid = (data as { session_id: string }).session_id;
      sessionStorage.setItem("recourse:session_id", sid);
      setTimeout(() => router.push("/results"), 400);
      return;
    }
    if (t === "data-error") {
      const message = (data as { message: string }).message;
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "active" ? { ...s, status: "error", detail: message } : s,
        ),
      );
      return;
    }
    setSteps((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => `data-${s.key}` === t);
      if (idx < 0) return prev;
      next[idx] = { ...next[idx], status: "done", detail: summarize(t, data) };
      const nn = next.findIndex((s) => s.status === "pending");
      if (nn >= 0) next[nn] = { ...next[nn], status: "active" };
      return next;
    });
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <span className="text-xl font-medium">Recourse</span>
      <h1 className="mt-10 text-3xl font-medium">Working on your notice…</h1>
      <ul className="mt-10 space-y-8" aria-live="polite">
        {steps.map((s) => (
          <li key={s.key} className="flex gap-4">
            <StatusDot status={s.status} />
            <div>
              <p
                className={
                  s.status === "pending"
                    ? "text-[color:var(--color-ink-faint)]"
                    : "text-[color:var(--color-ink)] font-medium"
                }
              >
                {s.label}
                {s.status === "active" ? "…" : ""}
              </p>
              {s.detail && (
                <p
                  className={`mt-1 text-sm ${
                    s.status === "error"
                      ? "text-red-700"
                      : "text-[color:var(--color-ink-muted)]"
                  }`}
                >
                  → {s.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-16 text-sm text-[color:var(--color-ink-faint)]">
        This usually takes 20–40 seconds.
      </p>
      {transportError && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {transportError}{" "}
          <button
            type="button"
            onClick={() => location.reload()}
            className="underline"
          >
            Tap to retry
          </button>
          .
        </p>
      )}
    </main>
  );
}

function StatusDot({ status }: { status: StepStatus }) {
  const base = "size-4 rounded-full mt-1 shrink-0";
  if (status === "done") return <span className={`${base} bg-[color:var(--color-ink)]`} />;
  if (status === "active")
    return (
      <span
        className={`${base} border-2 border-[color:var(--color-ink)] animate-pulse`}
      />
    );
  if (status === "error") return <span className={`${base} bg-red-600`} />;
  return <span className={`${base} border border-[color:var(--color-ink-faint)]`} />;
}
