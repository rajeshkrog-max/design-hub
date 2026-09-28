import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar } from "@/components/shared";
import { ROUND_LABELS } from "@/lib/rules";
import { getBatchReport } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

function Page({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="print-page mx-auto mb-6 w-full max-w-[820px] rounded-2xl bg-background p-10 shadow-[var(--shadow-raised)] print:mb-0 print:min-h-[297mm] print:rounded-none print:shadow-none">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3 text-xs text-muted-foreground">
        <span>Sera Interview Arena · Batch report</span>
        <span>Page {n} of 10</span>
      </div>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function BatchReportView({ user, batchId, back }: { user: SessionUser; batchId: string; back: () => void }) {
  let data;
  try {
    data = getBatchReport(user, batchId);
  } catch {
    return (
      <div className="pt-10 text-center">
        <p className="text-lg font-medium">You don't have access</p>
        <Button className="mt-4" variant="clay" onClick={back}>Back</Button>
      </div>
    );
  }
  const { batch, students } = data;
  const total = students.length || 1;
  const done = students.filter((d) => d.session?.status === "completed");
  const offers = students.filter((d) => d.offer?.decision === "accepted");
  const avg = students.reduce((a, d) => a + d.readiness, 0) / total;
  const sorted = [...students].sort((a, b) => b.readiness - a.readiness);

  const weakCounts = new Map<string, number>();
  for (const d of students) for (const r of d.rounds) for (const g of r.gaps) weakCounts.set(g.text, (weakCounts.get(g.text) ?? 0) + 1);
  const weakAreas = [...weakCounts.entries()].map(([text, n]) => ({ text, pct: Math.round((n / total) * 100) })).sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={back}><ArrowLeft className="size-4" /> Back</Button>
        <Button onClick={() => window.print()}><Printer className="size-4" /> Print / save PDF</Button>
      </div>

      <Page n={1} title="Cover">
        <div className="pt-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Batch readiness report</p>
          <h1 className="mt-4 text-4xl font-medium">{batch.name}</h1>
          <p className="mt-2 text-muted-foreground">{batch.program} · {batch.year}</p>
          <p className="mt-8 text-6xl font-medium">{Math.round(avg)}</p>
          <p className="text-sm text-muted-foreground">Average readiness</p>
        </div>
      </Page>

      <Page n={2} title="Cohort snapshot">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          {[[students.length, "Students"], [done.length, "Completed"], [offers.length, "Offers accepted"]].map(([v, l]) => (
            <div key={l as string} className="rounded-xl bg-secondary/40 p-5"><p className="text-3xl font-medium">{v}</p><p className="mt-1 text-xs text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </Page>

      <Page n={3} title="Round completion funnel">
        <div className="space-y-4">
          {(["screening", "hr_bp", "functional", "ceo"] as const).map((round) => {
            const n = students.filter((d) => d.rounds.some((r) => r.round === round && r.status === "completed")).length;
            const pct = Math.round((n / total) * 100);
            return (
              <div key={round}>
                <div className="mb-1.5 flex justify-between text-sm"><span>{ROUND_LABELS[round]}</span><span className="text-muted-foreground">{n} · {pct}%</span></div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </div>
      </Page>

      <Page n={4} title="Common weak areas">
        <div className="space-y-4">
          {weakAreas.length === 0 && <p className="text-sm text-muted-foreground">No gaps recorded yet.</p>}
          {weakAreas.map((w) => (
            <div key={w.text}>
              <div className="mb-1.5 flex justify-between text-sm"><span>{w.text}</span><span className="text-muted-foreground">{w.pct}% of batch</span></div>
              <ProgressBar value={w.pct} tone="rose" />
            </div>
          ))}
        </div>
      </Page>

      <Page n={5} title="Top performers">
        <div className="space-y-2 text-sm">
          {sorted.slice(0, 8).map((d, i) => (
            <div key={d.student.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
              <span>{i + 1}. {d.student.name}</span>
              <Pill tone="sage">{d.readiness}</Pill>
            </div>
          ))}
        </div>
      </Page>

      <Page n={6} title="Students needing attention">
        <div className="space-y-2 text-sm">
          {sorted.slice(-8).reverse().map((d) => (
            <div key={d.student.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-3">
              <span>{d.student.name}</span>
              <span className="text-muted-foreground">{d.readiness} · {d.weak_area}</span>
            </div>
          ))}
        </div>
      </Page>

      <Page n={7} title="Retry outcomes">
        <div className="space-y-2 text-sm">
          {students.flatMap((d) =>
            d.rounds.filter((r) => !r.is_current && r.verdict === "needs_improvement").map((t) => {
              const next = d.rounds.find((r) => r.round === t.round && r.try_no === 2);
              return (
                <div key={`${d.student.id}-${t.round}`} className="flex justify-between rounded-xl bg-secondary/40 p-3">
                  <span>{d.student.name} · {ROUND_LABELS[t.round]}</span>
                  <span className="text-muted-foreground">{t.score ?? 0} → {next?.score ?? "—"}</span>
                </div>
              );
            }),
          )}
        </div>
      </Page>

      <Page n={8} title="Offers">
        <div className="space-y-2 text-sm">
          {offers.length === 0 && <p className="text-muted-foreground">No accepted offers yet.</p>}
          {offers.map((d) => (
            <div key={d.student.id} className="flex justify-between rounded-xl bg-secondary/40 p-3">
              <span>{d.student.name}</span>
              <span className="text-muted-foreground">{d.offer?.role} · {d.offer?.ctc}</span>
            </div>
          ))}
        </div>
      </Page>

      <Page n={9} title="Full roster">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">Name</th><th>State</th><th>Readiness</th><th>Verdict</th></tr></thead>
          <tbody>
            {sorted.map((d) => (
              <tr key={d.student.id} className="border-b border-border/40">
                <td className="py-2">{d.student.name}</td><td>{d.state_label}</td><td>{d.readiness}</td><td>{d.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Page>

      <Page n={10} title="Recommendations">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Focus next training sessions on the top two weak areas from page 4.</li>
          <li>Pair students needing attention with top performers for mock practice.</li>
          <li>Encourage students below the CEO threshold to use their one retry on the weakest round.</li>
        </ul>
        <p className="mt-8 text-xs text-muted-foreground">Generated by Sera Interview Arena · YZI Works.</p>
      </Page>
    </div>
  );
}
