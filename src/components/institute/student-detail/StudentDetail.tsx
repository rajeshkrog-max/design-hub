import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar, ScoreRing, Surface } from "@/components/shared";
import { ROUND_LABELS, ROUND_ORDER, currentRound } from "@/lib/rules";
import { getStudentDetail } from "@/services/institute";
import type { SessionUser } from "@/types/arena";

const tabs = ["Overview", "Profile", "Rounds", "History"] as const;

export function StudentDetail({ user, studentId, openReport, back }: {
  user: SessionUser;
  studentId: string;
  openReport: (id: string) => void;
  back: () => void;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  let detail;
  try {
    detail = getStudentDetail(user, studentId);
  } catch {
    return (
      <div className="pt-10 text-center">
        <p className="text-lg font-medium">You don't have access</p>
        <Button className="mt-4" variant="clay" onClick={back}>Back to students</Button>
      </div>
    );
  }
  const { student, profile, session, rounds, offer } = detail;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={back}><ArrowLeft className="size-4" /></Button>
          <div>
            <h1 className="text-2xl font-medium">{student.name}</h1>
            <p className="text-sm text-muted-foreground">{student.email} · {detail.state_label}</p>
          </div>
        </div>
        <Button onClick={() => openReport(studentId)}><FileText className="size-4" /> Full report</Button>
      </div>
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-secondary font-medium" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-5 md:grid-cols-3">
          <Surface className="p-6 text-center"><ScoreRing value={detail.readiness} label="Readiness" size="lg" /></Surface>
          <Surface className="p-6">
            <h2 className="font-medium">Status</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p>Current round: {detail.current_round ? ROUND_LABELS[detail.current_round] : "—"}</p>
              <p>Last score: {detail.last_score ?? "—"}</p>
              <p>Verdict: {detail.verdict}</p>
              <p>Weak area: {detail.weak_area}</p>
            </div>
          </Surface>
          <Surface className="p-6">
            <h2 className="font-medium">Offer</h2>
            <p className="mt-3 text-sm">{offer ? `${offer.role} · ${offer.ctc} · ${offer.decision}` : "No offer yet"}</p>
            {detail.restart && <p className="mt-3 text-sm">Restart: <Pill tone="attention">{detail.restart.status}</Pill></p>}
          </Surface>
        </div>
      )}

      {tab === "Profile" && (
        <Surface className="p-6">
          {!profile ? (
            <p className="text-sm text-muted-foreground">No profile yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-medium">Basics</h2>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p>Strength {profile.strength_score} · {profile.strength_tier}</p>
                  <p>{profile.education?.degree} {profile.education?.branch} · {profile.education?.college}</p>
                  <p>CGPA {profile.education?.cgpa ?? "—"} · Class of {profile.education?.grad_year ?? "—"}</p>
                  <p>Target: {profile.preferences?.role ?? "—"} · {profile.preferences?.expected_ctc ?? "—"}</p>
                  <p>Cities: {profile.preferences?.cities.join(", ") || "—"}</p>
                </div>
              </div>
              <div>
                <h2 className="font-medium">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills?.technical.map((s) => <Pill key={s.name} tone="sage">{s.name} · {s.level}</Pill>)}
                  {profile.skills?.tools.map((s) => <Pill key={s.name}>{s.name}</Pill>)}
                  {!profile.skills && <p className="text-sm text-muted-foreground">—</p>}
                </div>
                {profile.summary && <p className="mt-4 text-sm leading-6 text-muted-foreground">{profile.summary}</p>}
              </div>
            </div>
          )}
        </Surface>
      )}

      {tab === "Rounds" && (
        <div className="grid gap-4 md:grid-cols-2">
          {ROUND_ORDER.map((key) => {
            const row = currentRound(rounds, key);
            return (
              <Surface key={key} className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{ROUND_LABELS[key]}</p>
                  {row && <Pill tone={row.verdict === "passed" ? "success" : row.verdict === "needs_improvement" ? "attention" : "neutral"}>{row.status}</Pill>}
                </div>
                {row ? (
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p>Score: {row.score ?? "—"} · Try {row.try_no}</p>
                    <ProgressBar value={row.score ?? 0} />
                    {row.strengths.length > 0 && <p>Strengths: {row.strengths.join(", ")}</p>}
                    {row.gaps.length > 0 && <p>Gaps: {row.gaps.map((g) => g.text).join(", ")}</p>}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Not attempted</p>
                )}
              </Surface>
            );
          })}
          <p className="text-xs text-muted-foreground md:col-span-2">Transcripts and recordings stay private to the student unless they share consent.</p>
        </div>
      )}

      {tab === "History" && (
        <Surface className="p-6">
          <h2 className="font-medium">Attempts</h2>
          <div className="mt-4 space-y-3">
            {detail.attempts.length === 0 && <p className="text-sm text-muted-foreground">No attempts yet.</p>}
            {detail.attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-secondary/40 p-4 text-sm">
                <span>Attempt {a.attempt_no}</span>
                <span className="text-muted-foreground">{a.status} · avg {a.average_score?.toFixed(1) ?? "—"}</span>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </section>
  );
}
