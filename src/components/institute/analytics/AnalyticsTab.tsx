import { ProgressBar, Surface } from "@/components/shared";
import { ROUND_LABELS } from "@/lib/rules";
import { getAnalytics } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

export function AnalyticsTab({ user }: { user: SessionUser }) {
  const data = getAnalytics(user);
  const maxDist = Math.max(1, ...data.distribution);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-medium">Analytics</h1>
      <div className="grid gap-5 lg:grid-cols-2">
        <Surface className="p-6">
          <h2 className="font-medium">Common weak areas</h2>
          <div className="mt-4 space-y-4">
            {data.weakAreas.length === 0 && <p className="text-sm text-muted-foreground">No gaps recorded yet.</p>}
            {data.weakAreas.map((w) => (
              <div key={w.text}>
                <div className="mb-1.5 flex justify-between text-sm"><span>{w.text}</span><span className="text-muted-foreground">{w.pct}%</span></div>
                <ProgressBar value={w.pct} tone="rose" />
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Round pass rates</h2>
          <div className="mt-4 space-y-4">
            {data.passRates.map((r) => (
              <div key={r.round}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{ROUND_LABELS[r.round]}</span>
                  <span className="text-muted-foreground">{r.passRate}% pass · avg {r.avg}</span>
                </div>
                <ProgressBar value={r.passRate} />
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Readiness distribution</h2>
          <div className="mt-5 flex h-36 items-end gap-3">
            {data.distribution.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg bg-sage" style={{ height: `${(n / maxDist) * 100}%`, minHeight: n ? 8 : 2 }} />
                <span className="text-[10px] text-muted-foreground">{i * 20}–{i * 20 + 19}</span>
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Retry improvements</h2>
          <div className="mt-4 space-y-3">
            {data.retried.length === 0 && <p className="text-sm text-muted-foreground">No retries yet.</p>}
            {data.retried.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/40 p-3 text-sm">
                <span>{r.student} · {ROUND_LABELS[r.round]}</span>
                <span className="text-muted-foreground">{r.from} → {r.to || "—"}</span>
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Top readiness</h2>
          <div className="mt-4 space-y-2">
            {data.top.map((d) => (
              <div key={d.student.id} className="flex justify-between text-sm"><span>{d.student.name}</span><span className="text-muted-foreground">{d.readiness}</span></div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Needs attention</h2>
          <div className="mt-4 space-y-2">
            {data.attention.map((d) => (
              <div key={d.student.id} className="flex justify-between text-sm"><span>{d.student.name}</span><span className="text-muted-foreground">{d.readiness}</span></div>
            ))}
          </div>
        </Surface>
      </div>
    </section>
  );
}
