import { useEffect, useState } from "react";
import { Check, Lock, Mic, MicOff, RotateCcw } from "lucide-react";
import { Pill, ProgressBar, ScoreRing } from "@/components/shared";
import {
  ROUND_CHECKS, ROUND_DURATION_SEC, ROUND_LABELS, ROUND_ORDER, ROUND_PERSONAS, canResume, canRetry,
  currentAverage, currentRound, isVoiceRound, roundStatus, type Thresholds,
} from "@/lib/rules";
import { cn } from "@/lib/utils";
import {
  chooseCompany, decideOffer, endRound, getCompanyOptions, getMyAccount, getMySession, requestRestart,
  resumeRound, retryRound, startRound, unlockCeo,
} from "@/services/student";
import type { CompanyProfile, InterviewSession, Offer, RoundKey, SessionRound, SessionUser } from "@/types/arena";
import { Btn, Card, DotList, MetricBar, Orb, ROUND_SHORT, ROUND_TONE, formatClock, initials, toneFill, type GoTo } from "../ui";
import { AptitudeReview, AptitudeRunner } from "./AptitudePanel";

/** The round to show first: a live one, else the first unfinished one (HR BP while CEO waits to be unlocked). */
function defaultRound(rounds: SessionRound[], session: InterviewSession): RoundKey {
  const live = ROUND_ORDER.find((k) => currentRound(rounds, k)?.status === "live");
  if (live) return live;
  const next = ROUND_ORDER.find((k) => currentRound(rounds, k)?.status !== "completed");
  if (next === "ceo" && !session.ceo_unlocked) return "hr_bp";
  return next ?? "ceo";
}

export function InterviewTab({ user, goTo }: { user: SessionUser; goTo: GoTo }) {
  const data = getMySession(user);
  const { session, rounds, company } = data;
  const [picked, setPicked] = useState<RoundKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session || !session.company_profile_id) return <CompanyPicker user={user} />;

  const cur = picked ?? defaultRound(rounds, session);
  const row = currentRound(rounds, cur);

  function run(fn: () => void) {
    try {
      setError(null);
      fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="clay flex flex-wrap items-center gap-3 rounded-3xl px-3.5 py-2.5">
        <div className="flex flex-wrap gap-2">
          {ROUND_ORDER.map((key, i) => {
            const r = currentRound(rounds, key);
            const locked = key === "ceo" && !session.ceo_unlocked;
            const done = r?.status === "completed";
            const on = cur === key;
            return (
              <button
                key={key}
                onClick={() => setPicked(key)}
                aria-current={on ? "step" : undefined}
                className={cn("flex items-center gap-2 rounded-xl px-3 py-[7px] text-[12.5px] font-medium text-ink-2", on && "clay-inset text-ink", done && !on && "text-good")}
              >
                <span className={cn("grid size-[18px] place-items-center rounded-full bg-panel text-[10.5px] shadow-raise-sm", on && toneFill(ROUND_TONE[key]))}>
                  {locked ? <Lock className="size-3" /> : done ? "✓" : i + 1}
                </span>
                {ROUND_SHORT[key]}
                <span className="text-[11.5px] text-ink-3">{Math.round(ROUND_DURATION_SEC[key] / 60)} min</span>
              </button>
            );
          })}
        </div>
        <span className="flex-1" />
        <span className="text-[11.5px] text-ink-3">15 min interview · 20 min aptitude</span>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-bad/10 px-4 py-3 text-[12.5px] text-bad">{error}</p>}

      <div className="grid items-start gap-5 min-[1180px]:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="clay flex flex-col gap-[18px] rounded-3xl p-[22px] max-[1179px]:order-2 min-[1180px]:sticky min-[1180px]:top-4">
          <ReportPanel
            round={cur}
            row={row}
            session={session}
            rounds={rounds}
            thresholds={data.thresholds}
            canUnlock={data.can_unlock_ceo}
            company={company}
            offer={data.offer}
            onUnlock={() => run(() => { unlockCeo(user); setPicked("ceo"); })}
            onRetry={() => run(() => { if (row) retryRound(user, row.id); })}
          />
        </aside>
        <div className="clay flex min-h-[620px] flex-col rounded-3xl p-[26px]">
          <MainStage
            key={`${cur}-${row?.id ?? "none"}-${row?.status ?? ""}`}
            user={user}
            round={cur}
            row={row}
            session={session}
            rounds={rounds}
            company={company}
            offer={data.offer}
            passBar={data.thresholds.pass_bar}
            ceoAt={data.thresholds.ceo_threshold}
            goTo={goTo}
            setRound={setPicked}
            run={run}
          />
        </div>
      </div>

      <RestartCard user={user} session={session} rounds={rounds} run={run} />
    </section>
  );
}

function ReportPanel({ round, row, session, rounds, thresholds, canUnlock, company, offer, onUnlock, onRetry }: {
  round: RoundKey;
  row: SessionRound | undefined;
  session: InterviewSession;
  rounds: SessionRound[];
  thresholds: Thresholds;
  canUnlock: boolean;
  company: CompanyProfile | null;
  offer: Offer | null;
  onUnlock: () => void;
  onRetry: () => void;
}) {
  const tone = ROUND_TONE[round];
  const done = row?.status === "completed";
  const heading = done ? (round === "ceo" ? "Offer received" : "Round complete") : row?.status === "incomplete" ? "Ended incomplete" : "Building as you go";

  return (
    <>
      <div>
        <span className="eyebrow">{ROUND_LABELS[round]} · report</span>
        <h3 className="mt-1 text-[17px] font-semibold">{heading}</h3>
      </div>

      {!done && (
        <>
          <div className="flex items-center gap-4">
            <ScoreRing value={row?.progress_pct ?? 0} text={`${row?.progress_pct ?? 0}%`} tone={tone} size={96} />
            <p className="text-[12.5px] text-ink-2">
              {row?.status === "live" ? "Round in progress." : row?.status === "incomplete" ? "This round stopped after a second disconnect." : "Not started yet."}{" "}
              Your score, strengths and gaps appear here when the round ends.
            </p>
          </div>
          <div className="clay-inset rounded-2xl p-3.5">
            <span className="eyebrow">This round checks</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ROUND_CHECKS[round].map((c) => <Pill key={c} tone="raised">{c}</Pill>)}
            </div>
          </div>
        </>
      )}

      {done && round === "ceo" && (
        <p className="text-[12.5px] text-ink-2">
          {offer?.decision === "pending" ? `${ROUND_PERSONAS.ceo.name} offered you the role. Accept or decline on the right.` : offer ? `You ${offer.decision} the offer.` : "Round complete."}
        </p>
      )}

      {done && row && round !== "ceo" && (
        <>
          <div className="flex items-center gap-4">
            <ScoreRing value={row.score ?? 0} tone={tone} size={110} />
            <div>
              <Pill tone={row.verdict === "passed" ? "sage" : "bad"}>{row.verdict === "passed" ? "Passed" : "Needs work"} · bar {thresholds.pass_bar}</Pill>
              <p className="mt-2 text-[11.5px] text-ink-3">
                {round === "hr_bp" ? `Checked against ${company?.name ?? "the company"}'s requirements` : round === "aptitude" ? "15 questions · 20 minutes" : "5 minutes with Sera"}
                {row.try_no === 2 && " · retry result"}
              </p>
            </div>
          </div>
          <div className="grid gap-3">
            {row.rubric.map((m) => <MetricBar key={m.label} label={m.label} value={m.score} needs={thresholds.pass_bar} tone={tone} />)}
          </div>
          <DotList label="Strengths" items={row.strengths} dot="good" />
          <DotList label="Weak areas" items={row.gaps.map((g) => g.text)} dot="bad" />
          <DotList label="What to improve" items={row.improve} dot="amber" />
          {canRetry(row) && <Btn onClick={onRetry}><RotateCcw /> Retry this round · 1 left</Btn>}
        </>
      )}

      {round === "hr_bp" && done && <UnlockBox rounds={rounds} session={session} ceoAt={thresholds.ceo_threshold} canUnlock={canUnlock} onUnlock={onUnlock} />}
    </>
  );
}

function UnlockBox({ rounds, session, ceoAt, canUnlock, onUnlock }: { rounds: SessionRound[]; session: InterviewSession; ceoAt: number; canUnlock: boolean; onUnlock: () => void }) {
  const avg = currentAverage(rounds);
  const shown = avg === null ? 0 : Math.round(avg * 10) / 10;
  return (
    <div className="clay-inset rounded-[18px] p-4">
      <div className="flex justify-between text-[12.5px]">
        <span>Average of 3 rounds</span>
        <b className="tabular-nums">{shown} · needs {ceoAt}</b>
      </div>
      <ProgressBar value={shown} tone="blue" marker={ceoAt} className="mb-3.5 mt-2" />
      {session.ceo_unlocked ? (
        <Pill tone="blue">CEO round unlocked</Pill>
      ) : (
        <Btn variant="primary" className="w-full" disabled={!canUnlock} onClick={onUnlock}>{canUnlock ? "Unlock CEO round" : "Not reached yet"}</Btn>
      )}
    </div>
  );
}

function MainStage({ user, round, row, session, rounds, company, offer, passBar, ceoAt, goTo, setRound, run }: {
  user: SessionUser;
  round: RoundKey;
  row: SessionRound | undefined;
  session: InterviewSession;
  rounds: SessionRound[];
  company: CompanyProfile | null;
  offer: Offer | null;
  passBar: number;
  ceoAt: number;
  goTo: GoTo;
  setRound: (round: RoundKey) => void;
  run: (fn: () => void) => void;
}) {
  const tone = ROUND_TONE[round];
  const status = roundStatus(rounds, round, session.ceo_unlocked);
  const next = ROUND_ORDER[ROUND_ORDER.indexOf(round) + 1];

  if (round === "ceo" && !session.ceo_unlocked) {
    return (
      <BigStage>
        <Orb tone={tone} dim />
        <h2 className="text-[22px] font-semibold">CEO round is locked</h2>
        <p className="max-w-[44ch] text-center text-ink-2">Finish HR BP and reach an average of {ceoAt} across the first three rounds, then unlock it from the HR BP panel.</p>
      </BigStage>
    );
  }

  if (status === "locked") {
    const prev = ROUND_ORDER[ROUND_ORDER.indexOf(round) - 1]!;
    return (
      <BigStage>
        <Orb tone={tone} dim />
        <h2 className="text-[22px] font-semibold">{ROUND_LABELS[round]} is locked</h2>
        <p className="max-w-[44ch] text-center text-ink-2">Pass {ROUND_LABELS[prev]} first. Rounds open one at a time.</p>
      </BigStage>
    );
  }

  if (row?.status === "incomplete") {
    return (
      <BigStage>
        <Orb tone={tone} dim />
        <h2 className="text-[22px] font-semibold">Round ended incomplete</h2>
        <p className="max-w-[46ch] text-center text-ink-2">The call dropped a second time after the one resume. You can request a fresh start below.</p>
      </BigStage>
    );
  }

  if (row && canResume(row)) {
    return (
      <BigStage>
        <Orb tone={tone} dim />
        <h2 className="text-[22px] font-semibold">The call dropped</h2>
        <p className="max-w-[44ch] text-center text-ink-2">You have one resume. Pick up where the conversation stopped.</p>
        <Btn variant="primary" onClick={() => run(() => resumeRound(user, row.id))}>Resume round</Btn>
      </BigStage>
    );
  }

  if (row?.status === "live") {
    return isVoiceRound(round)
      ? <VoiceStage round={round} row={row} onEnd={() => run(() => endRound(user, row.id))} />
      : <AptitudeRunner user={user} row={row} company={company} run={run} />;
  }

  if (row?.status === "completed" && round === "aptitude") {
    return <AptitudeReview user={user} row={row} passBar={passBar} onContinue={() => setRound("hr_bp")} />;
  }

  if (row?.status === "completed" && round === "ceo") {
    return <OfferStage user={user} offer={offer} company={company} run={run} />;
  }

  if (row?.status === "completed") {
    const toCeo = round === "hr_bp";
    return (
      <BigStage>
        <Orb tone={tone} />
        <h2 className="text-2xl font-semibold">{ROUND_LABELS[round]} complete</h2>
        <p className="text-ink-2">Score {row.score}. Your full breakdown is in the report panel.</p>
        {toCeo && !session.ceo_unlocked ? (
          <Btn onClick={() => goTo("reports")}>See report</Btn>
        ) : next && (row.verdict === "passed" || toCeo) ? (
          <Btn variant="primary" onClick={() => setRound(next)}>Continue to {ROUND_SHORT[next]}</Btn>
        ) : null}
      </BigStage>
    );
  }

  // ready to start
  const persona = ROUND_PERSONAS[round];
  const minutes = Math.round(ROUND_DURATION_SEC[round] / 60);
  return (
    <BigStage>
      <Orb tone={tone} />
      <div className="text-center">
        <span className="eyebrow">{isVoiceRound(round) ? `Voice round · ${minutes} min` : `15 questions · ${minutes} min`}</span>
        <h2 className="mt-1 text-2xl font-semibold">{isVoiceRound(round) ? `${ROUND_LABELS[round]} with ${persona.name}` : "Aptitude test"}</h2>
        <p className="mx-auto mt-2 max-w-[48ch] text-ink-2">
          {isVoiceRound(round)
            ? `${persona.role}${company ? ` · ${company.name}` : ""}. Find a quiet place; the round starts as soon as you press start.`
            : `One question at a time, built for ${company?.name ?? "your target company"}. You can move back and forth before you submit.`}
        </p>
      </div>
      {isVoiceRound(round) && (
        <div className="flex flex-wrap justify-center gap-2">
          <Pill tone="raised"><Check className="size-3 text-good" /> Microphone ready</Pill>
          <Pill tone="raised"><Check className="size-3 text-good" /> Connection good</Pill>
        </div>
      )}
      <Btn variant="primary" onClick={() => run(() => startRound(user, round))}>Start {ROUND_SHORT[round]}</Btn>
    </BigStage>
  );
}

function BigStage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-[22px] py-5">{children}</div>;
}

function VoiceStage({ round, row, onEnd }: { round: RoundKey; row: SessionRound; onEnd: () => void }) {
  const total = ROUND_DURATION_SEC[round];
  const [left, setLeft] = useState(() => Math.round(total * (1 - row.progress_pct / 100)));
  const [muted, setMuted] = useState(false);
  const persona = ROUND_PERSONAS[round];
  const tone = ROUND_TONE[round];

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("grid size-[42px] place-items-center rounded-[14px] font-semibold shadow-raise-sm", toneFill(tone))}>{initials(persona.name)}</span>
          <div><b>{persona.name}</b><div className="text-[11.5px] text-ink-3">{persona.role}</div></div>
        </div>
        <span className="flex-1" />
        <Pill tone="raised"><i className="size-[7px] rounded-full bg-bad" />Live · connection good</Pill>
      </div>
      <BigStage>
        <Orb tone={tone} breathing={!muted} />
        <div className="text-[40px] font-semibold tracking-[-0.02em] tabular-nums">
          {formatClock(left)} <span className="text-base font-medium text-ink-3">/ {formatClock(total)}</span>
        </div>
        <Pill tone="sage" className="px-3.5 py-1.5 text-[13px]">{muted ? "Muted" : "Your turn · speak when ready"}</Pill>
      </BigStage>
      <div className="mt-3.5 flex justify-center gap-3">
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={muted}
          className="grid size-[46px] place-items-center rounded-[15px] bg-panel shadow-raise-sm [&_svg]:size-[19px]"
        >
          {muted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={onEnd} className="flex h-[46px] items-center gap-2 rounded-[15px] bg-bad px-[18px] font-medium text-white">End round</button>
      </div>
    </>
  );
}

function OfferStage({ user, offer, company, run }: { user: SessionUser; offer: Offer | null; company: CompanyProfile | null; run: (fn: () => void) => void }) {
  const name = getMyAccount(user).student.name.split(" ")[0];
  if (!offer) {
    return <BigStage><Orb tone="blue" /><h2 className="text-2xl font-semibold">CEO round complete</h2></BigStage>;
  }
  return (
    <BigStage>
      <Orb tone="blue" />
      <span className="eyebrow">{company?.name ?? "Your company"} · simulated offer</span>
      <h2 className="text-[26px] font-semibold">Congratulations, {name}</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {[["Role", offer.role], ["CTC", offer.ctc], ["Joining", offer.joining]].map(([label, value]) => (
          <div key={label} className="clay-inset rounded-2xl px-[18px] py-3 text-center"><div className="text-[11.5px] text-ink-3">{label}</div><b>{value}</b></div>
        ))}
      </div>
      {offer.decision === "pending" ? (
        <div className="flex gap-2.5">
          <Btn onClick={() => run(() => decideOffer(user, offer.id, "declined"))}>Decline</Btn>
          <Btn variant="primary" onClick={() => run(() => decideOffer(user, offer.id, "accepted"))}>Accept offer</Btn>
        </div>
      ) : (
        <Pill tone={offer.decision === "accepted" ? "sage" : "neutral"}>
          {offer.decision === "accepted" ? "Offer accepted · Print CV is unlocked in your profile" : "Offer declined"}
        </Pill>
      )}
      <p className="text-[11.5px] text-ink-3">A realistic simulation, not a real job offer.</p>
    </BigStage>
  );
}

function CompanyPicker({ user }: { user: SessionUser }) {
  const [error, setError] = useState<string | null>(null);
  const options = getCompanyOptions(user);
  return (
    <section className="flex flex-col gap-5">
      <Card>
        <span className="eyebrow">Before screening</span>
        <h2 className="mt-1 text-xl font-semibold">Choose your target company</h2>
        <p className="mt-1 text-[12.5px] text-ink-2">This choice shapes every round of this attempt. You choose once per attempt.</p>
        {error && <p role="alert" className="mt-3 text-[12.5px] text-bad">{error}</p>}
      </Card>
      <div className="grid gap-5 min-[860px]:grid-cols-3">
        {options.map((c) => (
          <Card key={c.id} className="flex flex-col">
            <b className="text-[15px]">{c.name}</b>
            <p className="mt-1 text-[12.5px] text-ink-2">{c.role} · {c.city}</p>
            <p className="mt-1 text-[11.5px] text-ink-3">{c.sector} · {c.ctc_min}–{c.ctc_max} LPA</p>
            <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">{c.requirements.map((r) => <Pill key={r} tone="raised">{r}</Pill>)}</div>
            <Btn
              variant="primary"
              className="mt-4"
              onClick={() => {
                try {
                  chooseCompany(user, c.id);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not choose this company");
                }
              }}
            >
              Target this company
            </Btn>
          </Card>
        ))}
        {options.length === 0 && <p className="text-[12.5px] text-ink-2">No companies match your profile tier yet.</p>}
      </div>
    </section>
  );
}

/** Institute students can ask for a fresh attempt once the journey is over or stuck. */
function RestartCard({ user, session, rounds, run }: { user: SessionUser; session: InterviewSession; rounds: SessionRound[]; run: (fn: () => void) => void }) {
  const [reason, setReason] = useState("");
  const account = getMyAccount(user);
  const ended = session.status === "completed" || rounds.some((r) => r.is_current && r.status === "incomplete");
  if (!ended || account.student.account_type !== "institute") return null;
  return (
    <Card title="Start fresh">
      <p className="text-[12.5px] text-ink-2">Ask your institute for a full restart. Your history stays for comparison.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <input
          className="clay-inset h-11 min-w-[220px] flex-1 rounded-[13px] bg-transparent px-4 text-sm outline-none"
          placeholder="Why do you want to restart?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Btn disabled={!reason.trim()} onClick={() => run(() => { requestRestart(user, reason); setReason(""); })}>Request restart</Btn>
      </div>
    </Card>
  );
}
