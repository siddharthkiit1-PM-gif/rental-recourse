"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@/lib/session/redis";

export function Results() {
  const [s, setS] = useState<Session | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("recourse:session_id");
    if (!id) {
      setErr("Session expired. Please start over.");
      return;
    }
    fetch(`/api/session/${id}`)
      .then(async (r) => {
        if (r.ok) setS((await r.json()) as Session);
        else setErr(((await r.json()) as { error: string }).error);
      })
      .catch(() => setErr("Could not load your draft. Please retry."));
  }, []);

  if (err)
    return (
      <main className="p-10">
        <p className="text-red-700">{err}</p>
        <Link href="/intake" className="mt-4 inline-block underline">
          Start over →
        </Link>
      </main>
    );
  if (!s || !s.draft)
    return <main className="p-10 text-[color:var(--color-ink-muted)]">Loading…</main>;

  const { classification, forum, checklist, draft } = s;

  return (
    <main className="min-h-dvh">
      <header className="border-b border-[color:var(--color-hairline)] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-medium">Recourse</span>
          <Link
            href="/done?dl=1"
            className="px-4 py-2 rounded-md bg-[color:var(--color-ink)] text-white text-sm font-medium"
          >
            Download PDF
          </Link>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col-reverse md:grid md:grid-cols-[380px_1fr] gap-6">
        <aside className="rounded-xl bg-white border border-[color:var(--color-hairline)] p-6 space-y-6">
          <Section
            label="YOUR SITUATION"
            body={classification?.situation_type.replace(/_/g, " ")}
          />
          <Section
            label="WHERE TO FILE"
            body={forum?.jurisdiction}
            sub={forum?.reasoning}
          />
          <Section label="LEGAL BASIS">
            <ul className="text-sm space-y-2 mt-2">
              {draft.citations.map((c, i) => (
                <li key={i}>
                  • {c.act}, Sec {c.section}
                </li>
              ))}
            </ul>
          </Section>
          <Section label="EVIDENCE TO ATTACH">
            <ul className="text-sm space-y-1 mt-2">
              {checklist?.attached.map((e, i) => (
                <li key={i}>☑ {e}</li>
              ))}
              {checklist?.recommended_additional.map((e, i) => (
                <li key={`r${i}`} className="text-[color:var(--color-ink-muted)]">
                  ☐ {e}{" "}
                  <span className="text-[color:var(--color-ink-faint)]">(recommended)</span>
                </li>
              ))}
              {checklist?.missing_weakness_flags.map((f, i) => (
                <li key={`w${i}`} className="text-red-700">
                  ⚠ {f}
                </li>
              ))}
            </ul>
          </Section>
          {forum?.limitation_flag && (
            <p className="text-sm text-red-700">{forum.limitation_flag}</p>
          )}
        </aside>
        <section className="rounded-xl bg-white border border-[color:var(--color-hairline)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">LEGAL NOTICE</h2>
            <Link
              href="/edit"
              className="text-sm px-3 py-1.5 rounded-md border border-[color:var(--color-ink)]"
            >
              Edit draft
            </Link>
          </div>
          <hr className="my-4 border-[color:var(--color-hairline)]" />
          <pre className="whitespace-pre-wrap font-serif text-[15px] leading-6">
            {s.edited_draft ?? draft.draft_text}
          </pre>
          <FeedbackWidget sessionId={s.session_id} />
        </section>
      </div>
    </main>
  );
}

function Section({
  label,
  body,
  sub,
  children,
}: {
  label: string;
  body?: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[color:var(--color-ink-faint)]">{label}</p>
      {body && <p className="mt-1 font-medium capitalize">{body}</p>}
      {sub && <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{sub}</p>}
      {children}
    </div>
  );
}

function FeedbackWidget({ sessionId }: { sessionId: string }) {
  const [sent, setSent] = useState<number | null>(null);
  async function rate(n: 1 | 2 | 3 | 4 | 5) {
    setSent(n);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, rating: n }),
    }).catch(() => {});
  }
  return (
    <div className="mt-10 pt-6 border-t border-[color:var(--color-hairline)]">
      <p className="text-sm text-[color:var(--color-ink-muted)]">
        Was this useful? {sent ? "Thanks for the feedback." : ""}
      </p>
      {!sent && (
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => rate(n as 1 | 2 | 3 | 4 | 5)}
              className="w-9 h-9 rounded-md border border-[color:var(--color-hairline)] hover:bg-[color:var(--color-panel)]"
              aria-label={`Rate ${n} out of 5`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
