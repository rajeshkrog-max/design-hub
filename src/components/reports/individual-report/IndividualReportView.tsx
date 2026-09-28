import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar } from "@/components/shared";
import { ROUND_LABELS, ROUND_ORDER, currentRound } from "@/lib/rules";
import { getIndividualReport } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

function Page({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="print-page mx-auto mb-6 w-full max-w-[820px] rounded-2xl bg-background p-10 shadow-[var(--shadow-raised)] print:mb-0 print:min-h-[297mm] print:rounded-none print:shadow-none">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3 text-xs text-muted-foreground">
        <span>Sera Interview Arena · Individual report</span>
        <span>Page {n} of 11</span>
      </div>
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function IndividualReportView({ user, studentId, back }: { user: SessionUser; studentId: string; back: () => void }) {
  let data;
  try {
    data = getIndividualReport(user, studentId);
  } catch {
    return (
      <div className="pt-10 text-center">
        <p className="text-lg font-medium">You don't have access</p>
        <Button className="mt-4" variant="clay" onClick={back}>Back</Button>
      </div>
    );
  }
  const { student, profile, session, rounds, gaps, report, offer } = data;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={back}><ArrowLeft className="size-4" /> Back</Button>
        <Button onClick={() => window.print()}><Printer className="size-4" /> Print / save PDF</Button>
      </div>

      <Page n={1} title="Cover">
        <div className="pt-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interview readiness report</p>
          <h1 className="mt-4 text-4xl font-medium">{student.name}</h1>
          <p className="mt-2 text-muted-foreground">{profile?.education?.degree} {profile?.education?.branch} · {profile?.education?.college}</p>
          <p className="mt-8 text-6xl font-medium">{Math.round(session?.average_score ?? 0)}</p>
          <p className="text-sm text-muted-foreground">Overall readiness</p>
          {report && <div className="mt-6"><Pill tone="sage">{report.verdict.replace("_", " ")}</Pill></div>}
        </div>
      </Page>

      <Page n={2} title="Snapshot">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-secondary/40 p-4"><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 font-medium">{data.state_label}</p></div>
          <div className="rounded-xl bg-secondary/40 p-4"><p className="text-xs text-muted-foreground">Profile strength</p><p className="mt-1 font-medium">{profile?.strength_score ?? 0} · {profile?.strength_tier}</p></div>
          <div className="rounded-xl bg-secondary/40 p-4"><p className="text-xs text-muted-foreground">Attempts</p><p className="mt-1 font-medium">{data.attempts.length}</p></div>
          <div className="rounded-xl bg-secondary/40 p-4"><p className="text-xs text-muted-foreground">Offer</p><p className="mt-1 font-medium">{offer ? `${offer.role} · ${offer.decision}` : "None"}</p></div>
        </div>
      </Page>

      <Page n={3} title="Profile summary">
        <div className="space-y-3 text-sm leading-6">
          <p>{profile?.summary ?? "No summary on file."}</p>
          <p className="text-muted-foreground">Target role: {profile?.preferences?.role ?? "—"} · Expected CTC: {profile?.preferences?.expected_ctc ?? "—"} · Cities: {profile?.preferences?.cities.join(", ") || "—"}</p>
          <div className="flex flex-wrap gap-1.5">
            {profile?.skills?.technical.map((s) => <Pill key={s.name} tone="sage">{s.name} · {s.level}</Pill>)}
          </div>
        </div>
      </Page>

      {ROUND_ORDER.map((key, i) => {
        const row = currentRound(rounds, key);
        return (
          <Page key={key} n={4 + i} title={`${ROUND_LABELS[key]} — detail`}>
            {row ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-6">
                  <p className="text-5xl font-medium">{row.score ?? "—"}</p>
                  <div>
                    <Pill tone={row.verdict === "passed" ? "success" : "attention"}>{row.verdict ?? row.status}</Pill>
                    <p className="mt-2 text-xs text-muted-foreground">Try {row.try_no} · {row.duration_sec}s · {row.resume_used ? "resumed once" : "no resume used"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {row.rubric.map((r) => (
                    <div key={r.label}>
                      <div className="mb-1 flex justify-between text-xs"><span>{r.label}</span><span className="text-muted-foreground">{r.score}</span></div>
                      <ProgressBar value={r.score} />
                    </div>
                  ))}
                </div>
                {row.strengths.length > 0 && <p><span className="font-medium">Strengths:</span> {row.strengths.join(", ")}</p>}
                {row.gaps.length > 0 && (
                  <div>
                    <p className="font-medium">Gaps with evidence:</p>
                    <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                      {row.gaps.map((g, j) => <li key={j}>{g.text} — at {g.timestamp}</li>)}
                    </ul>
                  </div>
                )}
                {row.notes_for_next && <p className="text-muted-foreground">Notes carried forward: {row.notes_for_next}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This round was not attempted.</p>
            )}
          </Page>
        );
      })}

      <Page n={8} title="Gap diagnosis">
        <div className="space-y-4">
          {gaps.length === 0 && <p className="text-sm text-muted-foreground">No significant gaps diagnosed.</p>}
          {gaps.map((g) => (
            <div key={g.id} className="rounded-xl bg-secondary/40 p-4 text-sm">
              <div className="flex items-center justify-between"><p className="font-medium">{g.title}</p><Pill tone="attention">{g.gap_type}</Pill></div>
              <p className="mt-2 leading-6 text-muted-foreground">{g.evidence}</p>
              
            </div>
          ))}
        </div>
      </Page>

      <Page n={9} title="Roadmap">
        <ol className="space-y-3 text-sm">
          {(((report?.report.roadmap as string[] | undefined) ?? [])).map((step, i) => (
            <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-sage text-xs">{i + 1}</span><span className="leading-6">{step}</span></li>
          ))}
          {!report && <p className="text-muted-foreground">Roadmap is generated when the journey completes.</p>}
        </ol>
      </Page>

      <Page n={10} title="Attempt history">
        <div className="space-y-3 text-sm">
          {data.attempts.map((a) => (
            <div key={a.id} className="flex justify-between rounded-xl bg-secondary/40 p-4">
              <span>Attempt {a.attempt_no}</span>
              <span className="text-muted-foreground">{a.status} · avg {a.average_score?.toFixed(1) ?? "—"} · started {new Date(a.started_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Page>

      <Page n={11} title="Closing note">
        <p className="text-sm leading-7 text-muted-foreground">{(report?.report.encouragement as string | undefined) ?? "Keep going — every round is evidence, not a verdict."}</p>
        <p className="mt-8 text-xs text-muted-foreground">Generated by Sera Interview Arena · YZI Works. Transcripts remain private to the student.</p>
      </Page>
    </div>
  );
}
