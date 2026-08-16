import Link from "next/link";
import { V1_STATES } from "@/lib/corpus/manifest";

const STATE_CHIPS = [...V1_STATES].sort();

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <Header />
      <section className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[color:var(--color-ink)]">
          Landlord not returning your deposit?
        </h1>
        <p className="mt-6 text-lg text-[color:var(--color-ink-muted)] max-w-2xl">
          Free tool that drafts a filing-ready legal notice, grounded in your state&apos;s
          rent law and Indian national statutes. Takes ~5 minutes.
        </p>

        <div className="mt-10">
          <p className="text-sm font-medium tracking-wide text-[color:var(--color-ink)] uppercase">
            Select your state to begin
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATE_CHIPS.map((state) => (
              <Link
                key={state}
                href={`/intake?state=${encodeURIComponent(state)}`}
                className="inline-flex items-center px-4 py-2.5 rounded-lg border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-white text-sm font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)]"
              >
                {state}
              </Link>
            ))}
            <Link
              href="/intake?state=Other"
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-[color:var(--color-hairline)] bg-transparent text-[color:var(--color-ink)] text-sm font-medium hover:bg-[color:var(--color-panel)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)]"
            >
              Other state →
            </Link>
          </div>
          <p className="mt-3 text-sm text-[color:var(--color-ink-faint)]">
            Not on the list? Pick <strong>Other state</strong> — we&apos;ll draft using the
            Consumer Protection Act, Indian Contract Act, and CPC §80, which apply anywhere
            in India for deposit disputes.
          </p>
        </div>

        <p className="mt-8 text-sm text-[color:var(--color-ink-faint)]">
          No signup. No payment. Session only.
        </p>

        <hr className="my-16 border-[color:var(--color-hairline)]" />
        <h2 className="text-2xl font-medium" id="how">
          How it works
        </h2>
        <ol className="mt-6 space-y-4 text-[color:var(--color-ink)]">
          {[
            "Describe what happened (5 min)",
            "We classify your situation and pick the right forum",
            "We draft your legal notice grounded in statute",
            "Download PDF, send via registered post",
          ].map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="mt-1 grid place-items-center size-8 rounded-full border border-[color:var(--color-ink)] text-sm font-medium">
                {i + 1}
              </span>
              <span className="pt-1 text-base">{step}</span>
            </li>
          ))}
        </ol>
      </section>
      <Disclaimer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-[color:var(--color-hairline)] bg-[color:var(--color-surface)]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-xl font-medium tracking-tight">Recourse</span>
        <nav className="flex gap-6 text-sm text-[color:var(--color-ink-muted)]">
          <a href="#how">About</a>
          <a href="#disclaimer">Not legal advice</a>
        </nav>
      </div>
    </header>
  );
}

function Disclaimer() {
  return (
    <footer
      id="disclaimer"
      className="border-t border-[color:var(--color-hairline)] bg-[color:var(--color-panel)]"
    >
      <div className="max-w-3xl mx-auto px-6 py-8 text-sm text-[color:var(--color-ink-faint)]">
        This is an informational drafting tool. Not legal advice. For complex cases,
        consult a professional.
      </div>
    </footer>
  );
}
