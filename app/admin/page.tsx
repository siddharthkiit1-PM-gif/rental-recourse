import { formatHoursSince, launchTimestamp, loadMetrics } from "@/lib/admin/metrics";
import { Dashboard } from "./Dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ops — Recourse" };

export default async function AdminPage() {
  const metrics = await loadMetrics();
  const launchMs = launchTimestamp();
  const sinceLaunch = formatHoursSince(launchMs);
  return (
    <Dashboard
      metrics={metrics}
      launchIso={new Date(launchMs).toISOString()}
      sinceLaunch={sinceLaunch}
    />
  );
}
