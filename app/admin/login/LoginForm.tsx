"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#1a1712",
    color: "#f2ebd8",
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    display: "grid",
    placeItems: "center",
    padding: "2rem",
  } as const,
  card: {
    width: "100%",
    maxWidth: 380,
    padding: "2.5rem 2rem",
    border: "1px solid #33302a",
    background: "#221e18",
  } as const,
  eyebrowRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 32 } as const,
  dot: { width: 10, height: 10, background: "#e39a2b", display: "inline-block" } as const,
  eyebrow: {
    letterSpacing: "0.14em",
    fontSize: 11,
    color: "#8b8371",
    textTransform: "uppercase",
  } as const,
  heading: {
    fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
    fontSize: 32,
    fontWeight: 400,
    letterSpacing: "-0.01em",
    margin: 0,
    marginBottom: 28,
  } as const,
  label: {
    display: "block",
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#8b8371",
    marginBottom: 8,
  } as const,
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#1a1712",
    border: "1px solid #33302a",
    color: "#f2ebd8",
    fontFamily: "inherit",
    fontSize: 14,
    outline: "none",
  } as const,
  buttonBase: {
    width: "100%",
    marginTop: 20,
    padding: "12px",
    border: "none",
    fontFamily: "inherit",
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  } as const,
  message: { fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.5 } as const,
} as const;

function errorCopy(code: string | null): string | null {
  if (!code) return null;
  if (code === "rate_limited") return "Too many attempts. Wait a minute and try again.";
  return "That link is expired or already used. Enter your email to get a new one.";
}

export function LoginForm() {
  const params = useSearchParams();
  const errorFromUrl = errorCopy(params.get("error"));
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(errorFromUrl);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/admin/magic/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSent(true);
      setBusy(false);
      return;
    }
    if (res.status === 429) {
      setError("Too many attempts. Wait a minute and try again.");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error === "invalid email" ? "Enter a valid email." : "Something went wrong.");
    }
    setBusy(false);
  }

  const disabled = busy || !email;
  const buttonStyle = {
    ...styles.buttonBase,
    background: disabled ? "#33302a" : "#e39a2b",
    color: disabled ? "#8b8371" : "#1a1712",
    cursor: disabled ? "not-allowed" : "pointer",
  } as const;

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.eyebrowRow}>
          <span style={styles.dot} />
          <span style={styles.eyebrow}>Recourse — Ops</span>
        </div>

        <h1 style={styles.heading}>{sent ? "Check your inbox" : "Sign in"}</h1>

        {sent ? (
          <p style={{ ...styles.message, color: "#f2ebd8" }}>
            We just sent a sign-in link to <strong>{email}</strong>. It expires in
            15 minutes and can only be used once.
          </p>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            {error && (
              <p role="alert" style={{ ...styles.message, color: "#e07b5a" }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={disabled} style={buttonStyle}>
              {busy ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
