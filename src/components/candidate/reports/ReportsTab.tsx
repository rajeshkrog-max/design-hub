import { useState } from "react";
import { Printer } from "lucide-react";
import { Pill, ProgressBar, ScoreRing } from "@/components/shared";
import { ROUND_LABELS, ROUND_ORDER, canPrintCv, currentRound } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { getMyReport, getMySession } from "@/services/student";
import type { GapType, SessionUser } from "@/types/arena";
import { Btn, Card, GAP_LABEL, GAP_TONE, ROUND_TONE, type GoTo } from "../ui";

const CV_TEMPLATES = ["Clean single column", "Compact two column", "Modern header band"] as const;

export function ReportsTab({ user, goTo }: { user: SessionUser; goTo: GoTo }) {
  const [template, setTemplate] = useState(0);
  const report = getMyReport(user);
  const { rounds, offer, company, thresholds } = getMySession(user);

  if (!report) {
    return (
      <Card className="mx-auto w-full max-w-xl py-10 text-center">
        <span className="eyebrow">Full report</span>
        <h2 className="mt-2 text-xl font-semibold">Your report unlocks when your journey settles</h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-[12.5px] leading-6 text-ink-2">
          It appears once all four rounds are done, or when you can go no further in this attempt. Each round's own report is in the Interview panel as soon as it ends.
        </p>
        <Btn className="mt-5" onClick={() => goTo("interview")}>Open interview</Btn>
      </Card>
    );
  }

  const avg = report.session.average_score;
  const avgShown = avg === null ? null : Math.round(avg);
  const below = avg !== null && avg < thresholds.ceo_threshold;
  const heading = offer?.decision === "accepted" ? "Offer accepted" : offer ? "Offer received" : report.session.ceo_unlocked ? "Journey complete" : "CEO round not unlocked";
  const gaps = report.gaps.length ? report.gaps : rounds.flatMap((r) => r.gaps.map((g, i) => ({ id: `${r.id}-${i}`, gap_type: "skill" as GapType, title: g.text, evidence: `${ROUND_LABELS[r.round]} at ${g.timestamp}` })));
  const saved = report.report?.report["roadmap"];
  const roadmap = Array.isArray(saved) && saved.length >= 3
    ? (saved as string[])
    : [gaps[0] ? `Fix ${gaps[0].title.toLowerCase()}` : "Review each round report", gaps[1] ? `Work on ${gaps[1].title.toLowerCase()}` : "Practise with the STAR method", report.session.ceo_unlocked ? "Aim for a stronger CEO round" : "Retry, then reach the CEO round"];

  return (
    <section className="flex flex-col gap-5">
      <div className="clay flex flex-col items-center gap-[26px] rounded-3xl p-6 text-center min-[520px]:flex-row min-[520px]:text-left">
        <ScoreRing value={avgShown ?? 0} text={avgShown === null ? "—" : String(avgShown)} tone="amber" size={128} />
        <div className="flex-1">
          <span className="eyebrow">Full report{company ? ` · ${company.name} · ${company.role}` : ""}</span>
          <h2 className="my-1.5 text-2xl font-semibold">{heading}</h2>
          <p className="max-w-[62ch] text-ink-2">
            {avgShown === null ? "Not every round has a score yet." : `Your average is ${avgShown}${below ? `, ${thresholds.ceo_threshold - avgShown} below ${thresholds.ceo_threshold}` : ""}.`}{" "}
            {gaps.length ? `${gaps.length === 1 ? "One fixable gap" : `${gaps.length} fixable gaps`} to work on: ${gaps.map((g) => g.title.toLowerCase()).join(" and ")}.` : "No major gaps found."}
          </p>
        </div>
        <Btn onClick={() => window.print()}>Download PDF</Btn>
      </div>

      <div className="grid gap-5 min-[860px]:grid-cols-2">
        <Card title="Round by round" right={<span className="text-[11.5px] text-ink-3">Line = pass bar {thresholds.pass_bar}</span>}>
          <div className="grid gap-4">
            {ROUND_ORDER.map((key) => {
              const row = currentRound(report.rounds, key);
              const low = row?.score != null && row.score < thresholds.pass_bar;
              return (
                <div key={key}>
                  <div className="flex justify-between text-[12.5px]">
                    <span className={cn(!row?.score && "text-ink-3")}>{ROUND_LABELS[key]}</span>
                    {row?.score != null ? <b className={cn("tabular-nums", low && "text-bad")}>{row.score}</b> : <span className="text-ink-3">{key === "ceo" && !report.session.ceo_unlocked ? "Locked" : "—"}</span>}
                  </div>
                  <ProgressBar value={row?.score ?? 0} tone={ROUND_TONE[key]} marker={thresholds.pass_bar} className="mt-1.5" />
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Your roadmap">
          <div className="grid gap-3 min-[520px]:grid-cols-3">
            {["Now", "Next · 2–4 wks", "Later"].map((when, i) => (
              <div key={when} className="clay-inset rounded-2xl p-3.5">
                <span className="eyebrow">{when}</span>
                <p className="mt-1.5 text-[12.5px]">{roadmap[i]}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {gaps.length > 0 && (
        <Card title={offer ? "What to sharpen" : "Why you did not clear"}>
          <div className="grid gap-3.5 min-[520px]:grid-cols-2 min-[860px]:grid-cols-3">
            {gaps.map((g) => (
              <div key={g.id} className="clay-inset flex flex-col gap-2 rounded-2xl p-4">
                <Pill tone={GAP_TONE[g.gap_type]} className="self-start">{GAP_LABEL[g.gap_type]}</Pill>
                <b>{g.title}</b>
                <span className="text-[12.5px] text-ink-2">{g.evidence}</span>
                <Btn variant="ghost" className="justify-start p-0 text-[12.5px] text-good" onClick={() => goTo("resources")}>See free fix →</Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Print CV" right={!canPrintCv(rounds, offer) && <Pill tone="neutral">After offer</Pill>}>
        {canPrintCv(rounds, offer) ? (
          <>
            <p className="text-[12.5px] text-ink-2">Choose a template, then print or save as PDF.</p>
            <div className="mt-3 grid gap-3 min-[520px]:grid-cols-3">
              {CV_TEMPLATES.map((t, i) => (
                <button key={t} onClick={() => setTemplate(i)} aria-pressed={template === i} className={cn("rounded-2xl p-4 text-[12.5px] font-medium", template === i ? "clay-inset" : "bg-panel shadow-raise-sm")}>{t}</button>
              ))}
            </div>
            <Btn variant="primary" className="mt-4" onClick={() => window.print()}><Printer /> Print {CV_TEMPLATES[template]}</Btn>
          </>
        ) : (
          <p className="text-[12.5px] text-ink-2">Unlocks when all four rounds are done and you accept the offer.</p>
        )}
      </Card>
    </section>
  );
}
