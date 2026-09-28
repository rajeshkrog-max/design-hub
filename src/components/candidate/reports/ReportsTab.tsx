import { useState } from "react";
import { BookOpen, ExternalLink, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar, ScoreRing, Surface } from "@/components/shared";
import { ROUND_LABELS, ROUND_ORDER, canPrintCv, currentRound } from "@/lib/rules";
import { getMyReport, getMySession } from "@/services/student";
import type { SessionUser } from "@/types/arena";

const CV_TEMPLATES = ["Clean single column", "Compact two column", "Modern header band"] as const;

export function ReportsTab({ user }: { user: SessionUser }) {
  const [template, setTemplate] = useState(0);
  const report = getMyReport(user);
  const { rounds, offer } = getMySession(user);
  const printReady = canPrintCv(rounds, offer);

  if (!report) {
    return (
      <section className="mx-auto max-w-xl pt-10 text-center">
        <Surface className="p-10">
          <h1 className="text-2xl font-medium">Reports unlock when your journey settles</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your readiness report appears once you complete all four rounds, or when a round ends incomplete and you can go no further.
          </p>
        </Surface>
      </section>
    );
  }

  const verdictTone = report.report?.verdict === "offer_ready" ? "success" : report.report?.verdict === "needs_work" ? "attention" : "neutral";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Your readiness report</h1>
          <p className="mt-1 text-sm text-muted-foreground">Attempt {report.session.attempt_no} · {report.attempts.length} attempt(s) total</p>
        </div>
        {report.report && <Pill tone={verdictTone}>{report.report.verdict.replace("_", " ")}</Pill>}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Surface className="p-6 text-center">
          <ScoreRing value={Math.round(report.session.average_score ?? 0)} label="Overall readiness" size="lg" />
        </Surface>
        <Surface className="p-6 md:col-span-2">
          <h2 className="font-medium">Round by round</h2>
          <div className="mt-4 space-y-4">
            {ROUND_ORDER.map((key) => {
              const row = currentRound(report.rounds, key);
              return (
                <div key={key}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{ROUND_LABELS[key]}</span>
                    <span className="text-muted-foreground">{row?.score ?? "—"}</span>
                  </div>
                  <ProgressBar value={row?.score ?? 0} />
                  {row?.notes_for_next && <p className="mt-1 text-xs text-muted-foreground">{row.notes_for_next}</p>}
                </div>
              );
            })}
          </div>
        </Surface>
      </div>

      {report.gaps.length > 0 && (
        <Surface className="p-6">
          <h2 className="font-medium">Gap diagnosis</h2>
          <div className="mt-4 space-y-4">
            {report.gaps.map((g) => (
              <div key={g.id} className="rounded-xl bg-secondary/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{g.title}</p>
                  <Pill tone="attention">{g.gap_type}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{g.evidence}</p>
                
              </div>
            ))}
          </div>
        </Surface>
      )}

      {report.report && (
        <Surface className="p-6">
          <h2 className="font-medium">Your roadmap</h2>
          <ol className="mt-4 space-y-3">
            {((report.report.report.roadmap as string[] | undefined) ?? []).map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sage text-xs font-medium">{i + 1}</span>
                <span className="leading-6">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted-foreground">{(report.report.report.encouragement as string | undefined) ?? ""}</p>
        </Surface>
      )}

      <Surface className="p-6">
        <h2 className="font-medium">Print CV</h2>
        {printReady ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Choose a template and print or save as PDF.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {CV_TEMPLATES.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTemplate(i)}
                  className={`rounded-xl border p-4 text-sm ${template === i ? "border-success bg-sage/30" : "border-border"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button className="mt-5" onClick={() => window.print()}>
              <Printer className="size-4" /> Print {CV_TEMPLATES[template]}
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Unlocks when all rounds are complete and the offer is accepted.</p>
        )}
      </Surface>
    </section>
  );
}
