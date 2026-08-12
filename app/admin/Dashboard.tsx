"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Metrics } from "@/lib/admin/metrics";
import "./admin.css";

const INK = "#1a1712";
const CREAM = "#f2ebd8";
const AMBER = "#e39a2b";
const MUTED = "#8b8371";
const HAIRLINE = "#33302a";

type Props = { metrics: Metrics; launchIso: string; sinceLaunch: string };

export function Dashboard({ metrics, launchIso, sinceLaunch }: Props) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const maxDrafts = Math.max(1, ...metrics.by_day.map((d) => d.drafts));
  const completionPct = metrics.today.sessions
    ? ((metrics.today.drafts / metrics.today.sessions) * 100).toFixed(1)
    : "—";

  return (
    <main
      className="recourse-ops"
      style={{
        minHeight: "100dvh",
        background: INK,
        color: CREAM,
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        padding: "2.5rem clamp(1.25rem, 4vw, 3rem)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingBottom: 16,
          borderBottom: `1px solid ${HAIRLINE}`,
          marginBottom: 40,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span
            style={{ width: 10, height: 10, background: AMBER, display: "inline-block" }}
            aria-hidden
          />
          <span
            style={{
              letterSpacing: "0.14em",
              fontSize: 11,
              color: MUTED,
              textTransform: "uppercase",
            }}
          >
            Recourse — Ops
          </span>
          <span style={{ color: MUTED, fontSize: 11 }}>·</span>
          <span
            style={{ fontSize: 11, color: MUTED, letterSpacing: "0.06em" }}
            title={`Launched ${launchIso}`}
          >
            h+{sinceLaunch}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            background: "transparent",
            color: MUTED,
            border: `1px solid ${HAIRLINE}`,
            padding: "6px 12px",
            fontFamily: "inherit",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </header>

      <section style={{ marginBottom: 64 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            alignItems: "end",
            gap: 24,
          }}
        >
          <span
            style={{
              fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
              fontSize: "clamp(96px, 18vw, 200px)",
              lineHeight: 0.9,
              color: AMBER,
              letterSpacing: "-0.02em",
            }}
          >
            {metrics.total_drafts.toLocaleString("en-IN")}
          </span>
          <div style={{ paddingBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                color: MUTED,
                textTransform: "uppercase",
              }}
            >
              notices drafted · all-time
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
              from {metrics.total_sessions.toLocaleString("en-IN")} sessions
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 64 }}>
        <SectionHeader>Today · {metrics.today.day}</SectionHeader>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          <Stat label="drafts" value={metrics.today.drafts.toString()} />
          <Stat label="sessions" value={metrics.today.sessions.toString()} />
          <Stat label="completion" value={`${completionPct}%`} />
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <SectionHeader>Successful drafts · by day (IST)</SectionHeader>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: MUTED, textAlign: "left" }}>
              <Th w="18%">Day</Th>
              <Th>Volume</Th>
              <Th w="10%" alignRight>
                Drafts
              </Th>
              <Th w="12%" alignRight>
                Sessions
              </Th>
            </tr>
          </thead>
          <tbody>
            {metrics.by_day.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 24, color: MUTED }}>
                  No sessions in the last 24h window.
                </td>
              </tr>
            )}
            {metrics.by_day.map((d) => (
              <tr key={d.day} style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                <td style={{ padding: "12px 0", color: CREAM }}>{d.day}</td>
                <td style={{ padding: "12px 0" }}>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      height: 10,
                      width: `${(d.drafts / maxDrafts) * 100}%`,
                      background: AMBER,
                      opacity: d.drafts ? 1 : 0.2,
                    }}
                  />
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    textAlign: "right",
                    color: CREAM,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d.drafts}
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    textAlign: "right",
                    color: MUTED,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d.sessions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer
        style={{
          paddingTop: 32,
          borderTop: `1px solid ${HAIRLINE}`,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: MUTED,
          letterSpacing: "0.06em",
        }}
      >
        <span>
          data · upstash redis · session ttl 24h · numbers reflect the rolling 24h window
        </span>
        <span>
          fetched {new Date(metrics.fetched_at).toLocaleTimeString("en-IN")} · auto-refresh 30s
        </span>
      </footer>
    </main>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
        fontSize: 22,
        fontWeight: 400,
        letterSpacing: "-0.01em",
        margin: "0 0 16px 0",
      }}
    >
      {children}
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "24px 0", borderRight: `1px solid ${HAIRLINE}` }}>
      <div
        style={{
          fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
          fontSize: 56,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: CREAM,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Th({
  children,
  w,
  alignRight,
}: {
  children: React.ReactNode;
  w?: string;
  alignRight?: boolean;
}) {
  return (
    <th
      style={{
        padding: "10px 0",
        borderBottom: `1px solid ${HAIRLINE}`,
        fontWeight: 400,
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        textAlign: alignRight ? "right" : "left",
        width: w,
      }}
    >
      {children}
    </th>
  );
}
