import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar, Surface } from "@/components/shared";
import { decideRestart, getInstituteOverview } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

export function OverviewTab({ user }: { user: SessionUser }) {
  const [version, setVersion] = useState(0);
  const data = getInstituteOverview(user);
  const total = data.students.length || 1;

  return (
    <section className="space-y-6" key={version}>
      <div>
        <h1 className="text-2xl font-medium">{data.institute.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan: {data.institute.plan} · Pass bar {data.institute.pass_bar} · CEO threshold {data.institute.ceo_threshold}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Students", data.students.length],
          ["Strong profiles", data.bands.strong],
          ["Offers accepted", data.funnel.find((f) => f.label === "Offer accepted")?.value ?? 0],
        ].map(([label, value]) => (
          <Surface key={label as string} className="p-5 text-center">
            <strong className="text-3xl font-medium">{value}</strong>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </Surface>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Surface className="p-6">
          <h2 className="font-medium">Cohort funnel</h2>
          <div className="mt-5 space-y-4">
            {data.funnel.map((f) => (
              <div key={f.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{f.label}</span>
                  <span className="text-muted-foreground">{f.value} · {f.pct}%</span>
                </div>
                <ProgressBar value={f.pct} />
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <h2 className="font-medium">Readiness bands</h2>
          <div className="mt-5 space-y-4">
            {([["Strong (80+)", data.bands.strong, "sage"], ["Good (50–79)", data.bands.good, "blue"], ["Starter (<50)", data.bands.starter, "rose"]] as const).map(([label, n, tone]) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-muted-foreground">{n}</span>
                </div>
                <ProgressBar value={Math.round((n / total) * 100)} tone={tone as "sage" | "blue" | "rose"} />
              </div>
            ))}
          </div>
          <h2 className="mt-8 font-medium">Recent activity</h2>
          <div className="mt-3 space-y-2">
            {data.activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
            {data.activity.map((a) => (
              <p key={a.id} className="text-xs text-muted-foreground">{a.action} · {a.target_type} · {new Date(a.at).toLocaleString()}</p>
            ))}
          </div>
        </Surface>
      </div>
      {data.pendingRestarts.length > 0 && (
        <Surface className="p-6">
          <h2 className="font-medium">Restart requests</h2>
          <div className="mt-4 space-y-3">
            {data.pendingRestarts.map((r) => {
              const student = data.students.find((d) => d.student.id === r.student_id);
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/40 p-4">
                  <div>
                    <p className="text-sm font-medium">{student?.student.name ?? r.student_id}</p>
                    <p className="text-xs text-muted-foreground">{r.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { decideRestart(user, r.id, "approved"); setVersion((v) => v + 1); }}>Approve</Button>
                    <Button size="sm" variant="clay" onClick={() => { decideRestart(user, r.id, "declined"); setVersion((v) => v + 1); }}>Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      )}
    </section>
  );
}
