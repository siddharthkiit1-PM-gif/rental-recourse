"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export function Done() {
  const params = useSearchParams();
  const dl = params.get("dl") === "1";
  const started = useRef(false);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!dl || started.current) return;
    started.current = true;
    const id = sessionStorage.getItem("recourse:session_id");
    if (!id) return;
    window.location.assign(`/api/draft/download?id=${encodeURIComponent(id)}`);
    setDownloaded(true);
  }, [dl]);

  async function rate(r: number) {
    setRating(r);
    const id = sessionStorage.getItem("recourse:session_id");
    if (!id) return;
    await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ session_id: id, rating: r }),
      headers: { "content-type": "application/json" },
    }).catch(() => {});
    setSubmitted(true);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <span className="text-xl font-medium">Recourse</span>
      <div className="mt-8 flex gap-3 items-center">
        <span className="grid place-items-center size-10 rounded-full bg-[color:var(--color-ink)] text-white">
          ✓
        </span>
        <span className="font-medium">{downloaded ? "Downloaded" : "Ready"}</span>
      </div>
      <h1 className="mt-8 text-3xl font-medium">Your notice is ready.</h1>
      <h2 className="mt-10 text-xs font-medium text-[color:var(--color-ink-faint)]">
        NEXT STEPS
      </h2>
      <ol className="mt-4 space-y-3 list-decimal list-inside text-[color:var(--color-ink)]">
        <li>Print, sign, and send to your landlord via Registered Post (Speed Post also acceptable).</li>
        <li>Keep the tracking receipt as proof of dispatch.</li>
        <li>Wait 15 days for a response.</li>
        <li>If ignored, file at the Consumer Commission via e-Jagriti.</li>
      </ol>
      <a
        href="https://e-jagriti.gov.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex px-4 py-3 rounded-lg border border-[color:var(--color-ink)]"
      >
        → How to file at e-Jagriti (opens new tab)
      </a>
      <hr className="my-12 border-[color:var(--color-hairline)]" />
      <h3 className="text-lg font-medium">Was this useful?</h3>
      <div className="mt-3 flex gap-2 text-3xl">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => rate(r)}
            aria-label={`${r} stars`}
            className={
              r <= rating
                ? "text-[color:var(--color-ink)]"
                : "text-[color:var(--color-ink-faint)]"
            }
          >
            ★
          </button>
        ))}
      </div>
      {submitted && (
        <p className="mt-2 text-sm text-[color:var(--color-ink-muted)]">
          Thanks. Anonymous. Helps us improve.
        </p>
      )}
    </main>
  );
}
