"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionShape = {
  edited_draft?: string;
  draft?: { draft_text: string };
};

export function EditDraft() {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sid = sessionStorage.getItem("recourse:session_id");
    if (!sid) {
      router.replace("/intake");
      return;
    }
    setId(sid);
    fetch(`/api/session/${sid}`)
      .then((r) => r.json())
      .then((s: SessionShape) => setText(s.edited_draft ?? s.draft?.draft_text ?? ""))
      .catch(() => {});
  }, [router]);

  async function saveAndReturn() {
    if (!id) return;
    setSaving(true);
    await fetch("/api/draft/edit", {
      method: "POST",
      body: JSON.stringify({ session_id: id, edited_draft: text }),
      headers: { "content-type": "application/json" },
    });
    setSaving(false);
    router.push("/results");
  }

  return (
    <main className="min-h-dvh max-w-4xl mx-auto px-6 py-8">
      <header className="flex items-center justify-between">
        <span className="text-xl font-medium">Recourse</span>
        <button
          type="button"
          onClick={saveAndReturn}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-[color:var(--color-ink)] text-white text-sm font-medium disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save and return"}
        </button>
      </header>
      <p className="mt-6 text-sm text-[color:var(--color-ink-muted)]">
        Edit the notice below. Add facts we missed, adjust names, or refine tone. Max
        20,000 characters.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={20000}
        className="mt-4 w-full min-h-[70dvh] p-6 rounded-lg bg-white border border-[color:var(--color-hairline)] font-serif text-[15px] leading-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)]"
      />
      <a
        href="/results"
        className="mt-6 inline-block text-[color:var(--color-ink-muted)]"
      >
        ← Back to results
      </a>
    </main>
  );
}
