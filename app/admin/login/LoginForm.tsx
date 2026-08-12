"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace(next);
      router.refresh();
      return;
    }
    setError((await res.json().catch(() => ({}))).error ?? "sign-in failed");
    setBusy(false);
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#1a1712",
        color: "#f2ebd8",
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 380,
          padding: "2.5rem 2rem",
          border: "1px solid #33302a",
          background: "#221e18",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <span
            style={{
              width: 10,
              height: 10,
              background: "#e39a2b",
              display: "inline-block",
            }}
          />
          <span
            style={{
              letterSpacing: "0.14em",
              fontSize: 11,
              color: "#8b8371",
              textTransform: "uppercase",
            }}
          >
            Recourse — Ops
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            margin: 0,
            marginBottom: 28,
          }}
        >
          Sign in
        </h1>

        <label
          htmlFor="pw"
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#8b8371",
            marginBottom: 8,
          }}
        >
          Password
        </label>
        <input
          id="pw"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#1a1712",
            border: "1px solid #33302a",
            color: "#f2ebd8",
            fontFamily: "inherit",
            fontSize: 14,
            outline: "none",
          }}
        />

        {error && (
          <p
            role="alert"
            style={{ color: "#e07b5a", fontSize: 12, marginTop: 12, marginBottom: 0 }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "12px",
            background: busy || !password ? "#33302a" : "#e39a2b",
            color: busy || !password ? "#8b8371" : "#1a1712",
            border: "none",
            fontFamily: "inherit",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: busy || !password ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Signing in…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
