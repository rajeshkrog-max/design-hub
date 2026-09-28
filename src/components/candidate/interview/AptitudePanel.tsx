import { useEffect, useState } from "react";
import { Pill, ProgressBar } from "@/components/shared";
import { APTITUDE_QUESTION_COUNT, ROUND_DURATION_SEC } from "@/lib/rules";
import { cn } from "@/lib/utils";
import { aptitudeQuestions, getAptitudeAttempt, submitAptitude } from "@/services/student";
import type { CompanyProfile, SessionRound, SessionUser } from "@/types/arena";
import { Btn, formatClock } from "../ui";

const KEYS = "ABCD";
const LAST = APTITUDE_QUESTION_COUNT - 1;

/** Question card with ‹ › arrows on both sides (arrows hide on small screens). */
function QuestionCard({ index, onMove, children }: { index: number; onMove: (to: number) => void; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-4 min-[620px]:grid-cols-[52px_minmax(0,1fr)_52px]">
      <Arrow label="Previous question" disabled={index === 0} onClick={() => onMove(index - 1)}>‹</Arrow>
      <div className="clay-inset rounded-[22px] p-7">{children}</div>
      <Arrow label="Next question" disabled={index === LAST} onClick={() => onMove(index + 1)}>›</Arrow>
    </div>
  );
}

function Arrow({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="hidden size-[52px] place-items-center rounded-full bg-panel text-2xl leading-none text-ink shadow-raise-sm disabled:cursor-default disabled:opacity-35 min-[620px]:grid"
    >
      {children}
    </button>
  );
}

/** Live aptitude: one question at a time, 20-minute timer, submit on the last question. */
export function AptitudeRunner({ user, row, company, run }: { user: SessionUser; row: SessionRound; company: CompanyProfile | null; run: (fn: () => void) => void }) {
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [left, setLeft] = useState(() => Math.round(ROUND_DURATION_SEC.aptitude * (1 - row.progress_pct / 100)));
  const question = aptitudeQuestions[q]!;
  const answered = Object.keys(answers).length;

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3.5">
        <div>
          <span className="eyebrow">Aptitude · built for {company?.name ?? "your target company"}</span>
          <h2 className="mt-1 text-xl font-semibold">Question {q + 1} <span className="font-medium text-ink-3">of {APTITUDE_QUESTION_COUNT}</span></h2>
        </div>
        <span className="flex-1" />
        <div className="clay-inset rounded-2xl px-4 py-2.5 text-lg font-semibold tabular-nums">{formatClock(left)} <span className="text-[12.5px] font-medium text-ink-3">left</span></div>
      </div>
      <ProgressBar value={((q + 1) / APTITUDE_QUESTION_COUNT) * 100} tone="rose" className="mb-[26px] mt-[18px] h-1.5" />

      <QuestionCard index={q} onMove={setQ}>
        <Pill tone="sage">{question.topic}</Pill>
        <p className="mb-[22px] mt-4 max-w-[56ch] text-[19px] font-medium leading-[1.45]">{question.prompt}</p>
        <div className="grid gap-3">
          {(question.options ?? []).map((option, i) => {
            const on = answers[question.id] === i;
            return (
              <button
                key={option}
                onClick={() => setAnswers({ ...answers, [question.id]: i })}
                aria-pressed={on}
                className={cn("flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-medium", on ? "clay-inset" : "bg-panel shadow-raise-sm")}
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-[9px] text-xs", on ? "bg-amber text-amber-ink" : "clay-inset")}>{KEYS[i]}</span>
                {option}
              </button>
            );
          })}
        </div>
      </QuestionCard>

      <div className="mt-auto flex items-center gap-2.5 pt-6">
        <span className="text-[12.5px] text-ink-2 tabular-nums">{answered} of {APTITUDE_QUESTION_COUNT} answered</span>
        <span className="flex-1" />
        {q === LAST ? (
          <Btn variant="primary" onClick={() => run(() => submitAptitude(user, row.id, answers))}>Submit aptitude</Btn>
        ) : (
          <Btn variant="primary" onClick={() => setQ(q + 1)}>Next question</Btn>
        )}
      </div>
    </>
  );
}

/** After submit: slide through every question with the right answer and the student's answer marked. */
export function AptitudeReview({ user, row, passBar, onContinue }: { user: SessionUser; row: SessionRound; passBar: number; onContinue: () => void }) {
  const [i, setI] = useState(0);
  const attempt = getAptitudeAttempt(user, row.id);
  const question = aptitudeQuestions[i]!;
  const mine = attempt?.answers[question.id];
  const right = mine === question.correct;
  const correctCount = attempt?.mcq_score ?? Math.round(((row.score ?? 0) / 100) * APTITUDE_QUESTION_COUNT);
  const passed = row.verdict === "passed";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <span className="eyebrow">Aptitude · submitted</span>
          <h2 className="mt-1 text-2xl font-semibold">{correctCount} of {APTITUDE_QUESTION_COUNT} correct</h2>
        </div>
        <span className="flex-1" />
        <Pill tone={passed ? "sage" : "bad"} className="px-3.5 py-1.5 text-[13px]">{passed ? "Passed" : "Needs work"} · {row.score}</Pill>
      </div>
      <ProgressBar value={row.score ?? 0} tone="rose" marker={passBar} className="mb-[26px] mt-[18px] h-1.5" />

      <QuestionCard index={i} onMove={setI}>
        <div className="flex items-center gap-2.5">
          <span className="eyebrow">Review · question {i + 1} of {APTITUDE_QUESTION_COUNT} · {question.topic}</span>
          <span className="flex-1" />
          {mine !== undefined && <Pill tone={right ? "sage" : "bad"}>{right ? "Correct" : "Wrong"}</Pill>}
        </div>
        <p className="mb-5 mt-3.5 text-lg font-medium leading-[1.45]">{question.prompt}</p>
        <div className="grid gap-2.5">
          {(question.options ?? []).map((option, j) => {
            const isRight = j === question.correct;
            const picked = j === mine;
            return (
              <div
                key={option}
                className="flex w-full items-center gap-3 rounded-2xl bg-panel px-4 py-3.5 font-medium shadow-raise-sm"
                style={isRight ? { boxShadow: "var(--inset), 0 0 0 2px var(--good)" } : picked ? { boxShadow: "var(--inset), 0 0 0 2px var(--bad)" } : undefined}
              >
                <span className="clay-inset grid size-7 shrink-0 place-items-center rounded-[9px] text-xs">{KEYS[j]}</span>
                {option}
                <span className="flex-1" />
                <span className={cn("text-[11.5px]", isRight ? "text-good" : "text-bad")}>{isRight ? "Correct answer" : picked ? "Your answer" : ""}</span>
              </div>
            );
          })}
        </div>
      </QuestionCard>

      {passed && (
        <div className="mt-auto flex justify-end pt-6">
          <Btn variant="primary" onClick={onContinue}>Continue to HR BP</Btn>
        </div>
      )}
    </>
  );
}
