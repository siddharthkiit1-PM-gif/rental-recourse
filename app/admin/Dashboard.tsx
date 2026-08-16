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
const POSITIVE = "#8dbf8d";
const NEGATIVE = "#e07b5a";

type Props = { metrics: Metrics; launchIso: string; sinceLaunch: string };

function fmtN(n: number): string {
  return n.toLocaleString("en-IN");
}
function fmtPct(v: number | null, digits = 1): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}
function fmtDeltaPct(v: number | null): { text: string; color: string } {
  if (v == null) return { text: "—", color: MUTED };
  const sign = v > 0 ? "↑" : v < 0 ? "↓" : "·";
  const color = v > 0 ? POSITIVE : v < 0 ? NEGATIVE : MUTED;
  return { text: `${sign} ${Math.abs(v).toFixed(1)}%`, color };
}

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

  const { totals, prior, today, by_day, window_days, counters_start_day } = metrics;
  const maxAttempts = Math.max(1, ...by_day.map((d) => d.attempts));
  const delta = fmtDeltaPct(prior?.attempts_delta_pct ?? null);

  // Funnel drop-off percentages
  const attemptsToCompletion = totals.attempts > 0
    ? totals.completions / totals.attempts
    : null;
  const completionsToRatings = totals.completions > 0
    ? totals.ratings_total / totals.completions
    : null;

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
      <Header sinceLaunch={sinceLaunch} launchIso={launchIso} onLogout={logout} />

      {/* HERO */}
      <section style={{ marginBottom: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "end", gap: 32 }}>
          <span
            style={{
              fontFamily: "'Instrument Serif', ui-serif, Georgia, serif",
              fontSize: "clamp(96px, 18vw, 200px)",
              lineHeight: 0.9,
              color: AMBER,
              letterSpacing: "-0.02em",
            }}
          >
            {fmtN(totals.attempts)}
          </span>
          <div style={{ paddingBottom: 14, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" }}>
              draft attempts · last {window_days} days
            </div>
            <div style={{ fontSize: 14, color: CREAM }}>
              from <strong>{fmtN(totals.unique_ips)}</strong> unique users
              {prior != null && (
                <>
                  {" · "}
                  <span style={{ color: delta.color, fontVariantNumeric: "tabular-nums" }}>
                    {delta.text}
                  </span>
                  <span style={{ color: MUTED }}> vs prior {window_days}d</span>
                </>
              )}
            </div>
            <div style={{ fontSize: 13, color: MUTED }}>
              <strong style={{ color: CREAM }}>{fmtN(totals.completions)}</strong> completions
              {" · "}
              <strong style={{ color: CREAM }}>{fmtPct(totals.completion_rate)}</strong> completion rate
            </div>
          </div>
        </div>
      </section>

      {/* TODAY */}
      <section style={{ marginBottom: 56 }}>
        <SectionHeader>Today · {today.day}</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: `1px solid ${HAIRLINE}` }}>
          <Stat label="attempts" value={today.attempts.toString()} />
          <Stat label="unique IPs" value={today.unique_ips.toString()} />
          <Stat label="completions" value={today.completions.toString()} />
          <Stat label="5★ ratings" value={today.rating_5.toString()} />
        </div>
      </section>

      {/* FUNNEL */}
      <section style={{ marginBottom: 56 }}>
        <SectionHeader>Funnel · last {window_days} days</SectionHeader>
        <FunnelRow
          label="attempts"
          count={totals.attempts}
          max={Math.max(1, totals.attempts)}
          rate={null}
          rateLabel=""
        />
        <FunnelRow
          label="completions"
          count={totals.completions}
          max={Math.max(1, totals.attempts)}
          rate={attemptsToCompletion}
          rateLabel="of attempts"
        />
        <FunnelRow
          label="ratings"
          count={totals.ratings_total}
          max={Math.max(1, totals.attempts)}
          rate={completionsToRatings}
          rateLabel="of completions"
        />
        <FunnelRow
          label="5★"
          count={totals.rating_5}
          max={Math.max(1, totals.attempts)}
          rate={totals.five_star_share}
          rateLabel="of ratings"
        />
      </section>

      {/* DAILY */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader>Daily breakdown (IST)</SectionHeader>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: MUTED, textAlign: "left" }}>
              <Th w="14%">Day</Th>
              <Th>Volume</Th>
              <Th w="10%" alignRight>Attempts</Th>
              <Th w="12%" alignRight>Completions</Th>
              <Th w="10%" alignRight>Comp %</Th>
              <Th w="10%" alignRight>DAU</Th>
              <Th w="8%" alignRight>5★</Th>
            </tr>
          </thead>
          <tbody>
            {by_day.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, color: MUTED }}>
                  No traffic in the last {window_days} days.
                </td>
              </tr>
            )}
            {by_day.map((d) => {
              const countersLive = d.day >= counters_start_day;
              return (
                <tr key={d.day} style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                  <td style={{ padding: "12px 0", color: CREAM }}>{d.day}</td>
                  <td style={{ padding: "12px 0" }}>
                    <span
                      aria-hidden
                      style={{
                        display: "inline-block",
                        height: 10,
                        width: `${(d.attempts / maxAttempts) * 100}%`,
                        background: AMBER,
                        opacity: d.attempts ? 1 : 0.15,
                      }}
                    />
                  </td>
                  <Td right cream>{fmtN(d.attempts)}</Td>
                  <Td right cream={countersLive}>{countersLive ? fmtN(d.completions) : "—"}</Td>
                  <Td right cream={countersLive}>{countersLive ? fmtPct(d.completion_rate) : "—"}</Td>
                  <Td right cream>{fmtN(d.unique_ips)}</Td>
                  <Td right cream={countersLive}>{countersLive ? fmtN(d.rating_5) : "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <footer
        style={{
          paddingTop: 28,
          borderTop: `1px solid ${HAIRLINE}`,
          display: "grid",
          gap: 6,
          fontSize: 10,
          color: MUTED,
          letterSpacing: "0.03em",
          lineHeight: 1.5,
        }}
      >
        <span>
          data · upstash ratelimit analytics (attempts, DAU) + durable counters
          (completions, ratings, 5★) · 7-day rolling · IST buckets
        </span>
        <span>
          caveats · attempts = /api/agent hits, may include user retries ·
          DAU = unique IPs (multi-user households register as 1) ·
          completions/ratings/5★ counters started {counters_start_day}, earlier days show "—"
        </span>
        <span>
          fetched {new Date(metrics.fetched_at).toLocaleTimeString("en-IN")} · auto-refresh 30s
        </span>
      </footer>
    </main>
  );
}

function Header({
  sinceLaunch,
  launchIso,
  onLogout,
}: {
  sinceLaunch: string;
  launchIso: string;
  onLogout: () => void;
}) {
  return (
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
        onClick={onLogout}
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

function FunnelRow({
  label,
  count,
  max,
  rate,
  rateLabel,
}: {
  label: string;
  count: number;
  max: number;
  rate: number | null;
  rateLabel: string;
}) {
  const pct = max > 0 ? Math.max(1, (count / max) * 100) : 0;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px 1fr 90px 140px",
        alignItems: "center",
        gap: 16,
        padding: "10px 0",
        borderBottom: `1px solid ${HAIRLINE}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </div>
      <div
        style={{
          height: 14,
          width: `${pct}%`,
          background: AMBER,
          opacity: count > 0 ? 1 : 0.15,
        }}
        aria-hidden
      />
      <div style={{ textAlign: "right", color: CREAM, fontVariantNumeric: "tabular-nums" }}>
        {count.toLocaleString("en-IN")}
      </div>
      <div style={{ textAlign: "right", color: MUTED, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
        {rate != null ? `${(rate * 100).toFixed(1)}% ${rateLabel}` : ""}
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

function Td({
  children,
  right,
  cream,
}: {
  children: React.ReactNode;
  right?: boolean;
  cream?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 0",
        textAlign: right ? "right" : "left",
        color: cream ? CREAM : MUTED,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </td>
  );
}
