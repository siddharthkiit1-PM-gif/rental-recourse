import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <Header />
      <section className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[color:var(--color-ink)]">
          Landlord not returning your deposit?
        </h1>
        <p className="mt-6 text-lg text-[color:var(--color-ink-muted)] max-w-2xl">
          Free tool that drafts a legal notice grounded in the Karnataka Rent Act, Model
          Tenancy Act, and Consumer Protection Act. Takes ~5 minutes.
        </p>
        <Link
          href="/intake"
          className="inline-flex mt-10 items-center px-6 py-4 rounded-lg bg-[color:var(--color-ink)] text-white text-base font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ink)]"
        >
          Get my notice drafted →
        </Link>
        <p className="mt-4 text-sm text-[color:var(--color-ink-faint)]">
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
