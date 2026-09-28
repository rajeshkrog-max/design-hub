import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Lock, Mic, PhoneOff, Play, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, ProgressBar, ScoreRing, Surface } from "@/components/shared";
import {
  ROUND_DURATION_SEC, ROUND_LABELS, ROUND_ORDER, canResume, canRetry, ceoUnlocked,
  currentAverage, currentRound, roundStatus,
} from "@/lib/rules";
import {
  chooseCompany, decideOffer, endRound, getCompanyOptions, getMySession,
  recordDisconnect, requestRestart, resumeRound, retryRound, startRound,
} from "@/services/student";
import type { RoundKey, SessionUser } from "@/types/arena";
import { AptitudePanel } from "./AptitudePanel";

const ROUND_COLORS: Record<RoundKey, string> = {
  screening: "bg-sage",
  hr_bp: "bg-amber-soft",
  functional: "bg-rose-soft",
  ceo: "bg-blue-soft",
};

function Countdown({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <span className="font-mono text-lg">{m}:{s.toString().padStart(2, "0")}</span>;
}

export function InterviewTab({ user }: { user: SessionUser }) {
  const [version, setVersion] = useState(0);
  const [liveRound, setLiveRound] = useState<RoundKey | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [aptitudeDone, setAptitudeDone] = useState(false);
  const [restartReason, setRestartReason] = useState("");
  const [error, setError] = useState("");

  const { session, rounds, offer, company } = getMySession(user);
  const institute = { ceo_threshold: 65 };
  const avg = currentAverage(rounds);
  const unlocked = session ? ceoUnlocked(rounds, { ceo_threshold: institute.ceo_threshold } as never) : false;

  useEffect(() => {
    if (!liveRound) return;
    setSeconds(ROUND_DURATION_SEC[liveRound]);
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [liveRound]);

  const refresh = () => setVersion((v) => v + 1);

  // Live round panel
  if (liveRound) {
    const row = rounds.find((r) => r.round === liveRound && r.is_current);
    const isFunctional = liveRound === "functional";
    return (
      <section className="mx-auto max-w-2xl space-y-6" key={version}>
        <Surface className="p-8 text-center">
          <Pill tone="sage">{ROUND_LABELS[liveRound]} · live</Pill>
          <h1 className="mt-4 text-2xl font-medium">{row?.persona}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{company?.name ?? "Your target company"}</p>
          <div className="mx-auto mt-6 grid size-24 place-items-center rounded-full bg-sage shadow-[var(--shadow-soft)]">
            <Mic className="size-8 text-sage-foreground" />
          </div>
          <div className="mt-6"><Countdown seconds={seconds} /></div>
          <ProgressBar value={Math.round(((ROUND_DURATION_SEC[liveRound] - seconds) / ROUND_DURATION_SEC[liveRound]) * 100)} />
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="clay"
              onClick={() => {
                if (row) recordDisconnect(user, row.id);
                setLiveRound(null);
                refresh();
              }}
            >
              <PhoneOff className="size-4" /> Simulate disconnect
            </Button>
            <Button
              onClick={() => {
                if (row && (!isFunctional || aptitudeDone)) {
                  endRound(user, row.id);
                  setLiveRound(null);
                  setAptitudeDone(false);
                  refresh();
                }
              }}
              disabled={isFunctional && !aptitudeDone}
            >
              End round
            </Button>
          </div>
          {isFunctional && !aptitudeDone && (
            <p className="mt-3 text-xs text-muted-foreground">Finish the aptitude section below to end this round.</p>
          )}
        </Surface>
        {isFunctional && row && !aptitudeDone && (
          <AptitudePanel user={user} roundId={row.id} onDone={() => setAptitudeDone(true)} />
        )}
      </section>
    );
  }

  // No session yet → company picker (shown once per attempt, before screening)
  if (!session || !session.company_profile_id) {
    const options = getCompanyOptions(user);
    return (
      <section className="mx-auto max-w-3xl" key={version}>
        <h1 className="text-2xl font-medium">Choose your target company</h1>
        <p className="mt-1 text-sm text-muted-foreground">This choice shapes every round of this attempt. You choose once per attempt.</p>
        <div className="mt-6 grid gap-4">
          {options.map((c) => (
            <Surface key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.role} · {c.sector} · {c.city} · {c.ctc_min}–{c.ctc_max} LPA</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.requirements.map((r) => <Pill key={r}>{r}</Pill>)}
                </div>
              </div>
              <Button
                onClick={() => {
                  chooseCompany(user, c.id);
                  refresh();
                }}
              >
                Target this company
              </Button>
            </Surface>
          ))}
          {options.length === 0 && <p className="text-sm text-muted-foreground">No companies match your tier yet.</p>}
        </div>
      </section>
    );
  }

  const pendingRestart = false;
  const completedAll = ROUND_ORDER.every((k) => currentRound(rounds, k)?.status === "completed");

  return (
    <section className="space-y-6" key={version}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Interview arena</h1>
          <p className="mt-1 text-sm text-muted-foreground">Targeting {company?.name} · {company?.role}</p>
        </div>
        {avg !== null && <Pill tone="sage">Average so far: {avg.toFixed(1)}</Pill>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {ROUND_ORDER.map((key) => {
          const row = currentRound(rounds, key);
          const status = key === "ceo" && !unlocked && row?.status !== "completed" ? "locked" : roundStatus(rounds, key);
          return (
            <Surface key={key} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 place-items-center rounded-full ${ROUND_COLORS[key]} text-sm font-medium`}>
                    {ROUND_ORDER.indexOf(key) + 1}
                  </span>
                  <div>
                    <p className="font-medium">{ROUND_LABELS[key]}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(ROUND_DURATION_SEC[key] / 60)} min · {key === "functional" ? "aptitude + interview" : "voice interview"}</p>
                  </div>
                </div>
                {status === "locked" && <Lock className="size-4 text-muted-foreground" />}
                {row?.status === "completed" && row.verdict === "passed" && <CheckCircle2 className="size-5 text-success" />}
              </div>
              {key === "ceo" && status === "locked" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Unlock with an average of {institute.ceo_threshold}+ across the first three rounds.
                  {avg !== null && <> Current average: {avg.toFixed(1)}.</>}
                </p>
              )}
              {row?.status === "completed" && (
                <div className="mt-4 flex items-center gap-4">
                  <ScoreRing value={row.score ?? 0} size="sm" />
                  <div className="text-sm">
                    <Pill tone={row.verdict === "passed" ? "success" : "attention"}>
                      {row.verdict === "passed" ? "Passed" : "Needs improvement"}
                    </Pill>
                    {row.try_no === 2 && <p className="mt-2 text-xs text-muted-foreground">Retry result — this score counts now.</p>}
                  </div>
                </div>
              )}
              {row && canResume(row) && (
                <div className="mt-4 rounded-xl bg-amber-soft/30 p-3 text-sm">
                  Disconnected once — you can resume from where the call stopped.
                  <Button size="sm" className="ml-3" onClick={() => { resumeRound(user, row.id); setLiveRound(key); }}>Resume</Button>
                </div>
              )}
              {row?.status === "incomplete" && (
                <p className="mt-4 text-sm text-attention">Marked incomplete after a second disconnect.</p>
              )}
              {row && canRetry(row) && (
                <Button variant="clay" className="mt-4" onClick={() => { retryRound(user, row.id); refresh(); }}>
                  <RotateCcw className="size-4" /> Retry this round
                </Button>
              )}
              {(status === "ready" || row?.status === "ready") && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    try {
                      const r = startRound(user, key);
                      setLiveRound(r.round);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Could not start");
                    }
                  }}
                >
                  <Play className="size-4" /> Start round
                </Button>
              )}
              {key === "functional" && status !== "locked" && (
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Video className="size-3.5" /> Camera and mic check runs before this round.</p>
              )}
            </Surface>
          );
        })}
      </div>

      {offer && (
        <Surface className="p-7">
          <Pill tone="sage">Simulated offer</Pill>
          <h2 className="mt-3 text-xl font-medium">{offer.role} · {offer.ctc}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Joining {offer.joining}. This is a realistic simulation, not a real job offer.</p>
          {offer.decision === "pending" ? (
            <div className="mt-5 flex gap-3">
              <Button onClick={() => { decideOffer(user, offer.id, "accepted"); refresh(); }}>Accept offer</Button>
              <Button variant="clay" onClick={() => { decideOffer(user, offer.id, "declined"); refresh(); }}>Decline</Button>
            </div>
          ) : (
            <Pill tone={offer.decision === "accepted" ? "success" : "neutral"}>
              {offer.decision === "accepted" ? "Accepted" : "Declined"}
            </Pill>
          )}
        </Surface>
      )}

      {(session.status === "completed" || rounds.some((r) => r.is_current && r.status === "incomplete")) && (
        <Surface className="p-6">
          <h2 className="font-medium">Start fresh</h2>
          <p className="mt-1 text-sm text-muted-foreground">Request a full restart from your institute. History is kept for comparison.</p>
          <div className="mt-4 flex gap-3">
            <input
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Why do you want to restart?"
              value={restartReason}
              onChange={(e) => setRestartReason(e.target.value)}
            />
            <Button
              variant="clay"
              disabled={!restartReason.trim() || pendingRestart}
              onClick={() => {
                try {
                  requestRestart(user, restartReason);
                  setRestartReason("");
                  refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Restart unavailable");
                }
              }}
            >
              Request restart
            </Button>
          </div>
        </Surface>
      )}
      {completedAll && offer?.decision === "accepted" && (
        <Surface className="p-6 text-center">
          <Camera className="mx-auto size-6 text-success" />
          <p className="mt-2 text-sm">All rounds complete and offer accepted — your Print CV is unlocked in Reports.</p>
        </Surface>
      )}
    </section>
  );
}
