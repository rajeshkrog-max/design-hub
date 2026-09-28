import { ArrowRight, Check } from "lucide-react";
import { Pill, ProgressBar, TONE_BG } from "@/components/shared";
import {
  REQUIRED_PROFILE_SECTIONS, ROUND_DURATION_SEC, ROUND_LABELS, ROUND_ORDER, ROUND_PERSONAS, SECTION_WEIGHTS,
  canStartInterview, currentAverage, currentRound, filledSections, isVoiceRound, profileTier, roundStatus,
} from "@/lib/rules";
import { cn } from "@/lib/utils";
import { getMyProfile, getMySession } from "@/services/student";
import type { CompanyProfile, ProfileSectionKey, RoundKey, SessionRound, SessionUser } from "@/types/arena";
import { Btn, Card, Orb, ROUND_SHORT, ROUND_TONE, type GoTo } from "../ui";

const SECTION_TITLES: Record<ProfileSectionKey, string> = {
  personal: "Personal details", education: "Education", skills: "Skills", preferences: "Job preferences",
  summary: "About you", experience: "Internships and work", projects: "Projects", certifications: "Certifications",
  achievements: "Achievements", activities: "Activities and leadership", languages: "Languages",
};

function blurb(round: RoundKey, company: CompanyProfile | null) {
  const at = company?.name ?? "your target company";
  return {
    screening: `Five minutes with Sera on your story, your CV and why this role at ${at}.`,
    aptitude: `15 questions in 20 minutes: quant, logic, SQL and verbal, built for ${at}.`,
    hr_bp: `Five minutes on culture fit, your CV and salary expectations, checked against what ${at} needs.`,
    ceo: `A final five-minute conversation with the chief executive of ${at}. It can end with an offer.`,
  }[round];
}

export function HomeTab({ user, goTo }: { user: SessionUser; goTo: GoTo }) {
  const profile = getMyProfile(user);
  const { session, rounds, company, thresholds } = getMySession(user);
  const score = profile?.strength_score ?? 0;
  const tier = profileTier(score);
  const passed = ROUND_ORDER.filter((k) => currentRound(rounds, k)?.verdict === "passed");
  const avg = currentAverage(rounds);
  const filled = profile ? filledSections(profile) : [];
  const nextTier = score >= 80 ? null : score >= 50 ? "Strong" : "Good";
  const missingOptional = (Object.keys(SECTION_WEIGHTS) as ProfileSectionKey[]).filter((k) => !filled.includes(k) && !REQUIRED_PROFILE_SECTIONS.includes(k));

  return (
    <section className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5 min-[860px]:grid-cols-4">
        <Kpi label="Profile strength" value={<>{score} <small>/ 100</small></>}>
          <span className="text-warn">{tier.name}{nextTier && missingOptional[0] ? ` · add ${SECTION_TITLES[missingOptional[0]].toLowerCase()} to reach ${nextTier}` : ""}</span>
        </Kpi>
        <Kpi label="Rounds cleared" value={<>{passed.length} <small>of 4</small></>}>
          {passed.length ? `${passed.map((k) => ROUND_SHORT[k]).join(", ")} passed` : "None yet"}
        </Kpi>
        <Kpi label="Average score" value={avg === null ? "—" : Math.round(avg)}>
          {session?.ceo_unlocked ? "CEO round unlocked" : `CEO round opens at ${thresholds.ceo_threshold}`}
        </Kpi>
        <Kpi label="Target company" value={<span className="text-[17px]">{company?.name ?? "Not chosen yet"}</span>}>
          {company ? `${company.role} · ${company.ctc_min}–${company.ctc_max} LPA` : "You choose it before screening"}
        </Kpi>
      </div>

      <div className="grid gap-5 min-[1100px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Card title="Your interview journey" right={session && <Pill tone="neutral" className="clay-inset">Attempt {session.attempt_no}</Pill>}>
          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 min-[860px]:grid-cols-4">
            {ROUND_ORDER.map((key) => (
              <Stage key={key} round={key} row={currentRound(rounds, key)} status={roundStatus(rounds, key, session?.ceo_unlocked)} passBar={thresholds.pass_bar} ceoAt={thresholds.ceo_threshold} />
            ))}
          </div>
          <UpNext goTo={goTo} rounds={rounds} ceoOpen={!!session?.ceo_unlocked} hasSession={!!session?.company_profile_id} company={company} profileReady={canStartInterview(profile)} />
        </Card>

        <div className="grid content-start gap-5">
          <LatestFeedback rounds={rounds} goTo={goTo} />
          <Card title="Profile to finish" right={<span className="text-[11.5px] text-ink-3 tabular-nums">{filled.length} of 11</span>}>
            <CheckRow done={!!profile?.cv_file_key} text={profile?.cv_file_key ? `CV uploaded · ${profile.cv_file_key.split("/").pop()}` : "Upload your CV"} onAdd={() => goTo("profile")} primary />
            {(Object.keys(SECTION_TITLES) as ProfileSectionKey[])
              .filter((k) => !filled.includes(k))
              .slice(0, 3)
              .map((k, i) => (
                <CheckRow
                  key={k}
                  done={false}
                  text={SECTION_TITLES[k]}
                  hint={REQUIRED_PROFILE_SECTIONS.includes(k) ? "needed to start" : `adds ${SECTION_WEIGHTS[k]} to strength`}
                  onAdd={() => goTo("profile")}
                  primary={i === 0}
                />
              ))}
            {filled.length === 11 && <p className="text-[12.5px] text-ink-2">Every section is filled in.</p>}
          </Card>
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, children }: { label: string; value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="clay flex flex-col gap-1.5 rounded-3xl px-5 py-[18px]">
      <span className="eyebrow">{label}</span>
      <span className="text-[26px] font-semibold tracking-[-0.01em] tabular-nums [&_small]:text-[13px] [&_small]:font-medium [&_small]:text-ink-3">{value}</span>
      <span className="text-[11.5px] text-ink-3">{children}</span>
    </div>
  );
}

function Stage({ round, row, status, passBar, ceoAt }: { round: RoundKey; row: SessionRound | undefined; status: string; passBar: number; ceoAt: number }) {
  const tone = ROUND_TONE[round];
  const minutes = Math.round(ROUND_DURATION_SEC[round] / 60);
  let note: React.ReactNode;
  if (row?.status === "completed") {
    note = row.verdict === "passed" ? <span className="text-good">Passed</span> : <span className="text-bad">Needs work</span>;
  } else if (row?.status === "live") note = <span className="text-warn">In progress</span>;
  else if (row?.status === "incomplete") note = <span className="text-bad">Incomplete</span>;
  else if (status === "ready") note = <span className="text-warn">Up next · {minutes} min</span>;
  else note = <span className="text-ink-3">{round === "ceo" ? `Locked · needs avg ${ceoAt}` : "Locked"}</span>;
  const fill = row?.status === "completed" ? row.score ?? 0 : row?.status === "live" ? row.progress_pct : 0;
  return (
    <div className="clay-inset flex flex-col gap-2.5 rounded-2xl p-3.5">
      <div className="flex items-center gap-2 text-[13px] font-semibold"><i className={cn("size-2.5 rounded-full", TONE_BG[tone])} />{ROUND_SHORT[round]}</div>
      <div className={cn("text-[22px] font-semibold tabular-nums", row?.score == null && "text-ink-3")}>{row?.score ?? "—"}</div>
      <ProgressBar value={fill} tone={tone} marker={passBar} />
      <span className="text-[11.5px]">{note}</span>
    </div>
  );
}

function UpNext({ goTo, rounds, ceoOpen, hasSession, company, profileReady }: {
  goTo: GoTo; rounds: SessionRound[]; ceoOpen: boolean; hasSession: boolean; company: CompanyProfile | null; profileReady: boolean;
}) {
  const next = ROUND_ORDER.find((k) => currentRound(rounds, k)?.status !== "completed");
  let tone = next ? ROUND_TONE[next] : ROUND_TONE.ceo;
  let title: string;
  let copy: string;
  let action: { label: string; view: "interview" | "profile" | "reports" };

  if (!profileReady) {
    title = "Finish your profile";
    copy = "Personal details, education, skills and job preferences are needed before your first round.";
    action = { label: "Open profile", view: "profile" };
    tone = "sage";
  } else if (!hasSession) {
    title = "Choose your target company";
    copy = "Pick one company for this attempt. Every round is built around it.";
    action = { label: "Choose company", view: "interview" };
    tone = "sage";
  } else if (!next) {
    title = "Journey complete";
    copy = "All four rounds are done. Your full report is ready.";
    action = { label: "Open report", view: "reports" };
  } else if (next === "ceo" && !ceoOpen) {
    title = "CEO round is locked";
    copy = "Unlock it from the HR BP result panel once your average reaches the bar.";
    action = { label: "Open interview", view: "interview" };
  } else {
    const persona = isVoiceRound(next) ? ` with ${ROUND_PERSONAS[next].name}` : "";
    title = `${ROUND_LABELS[next]}${persona}`;
    copy = blurb(next, company);
    const live = currentRound(rounds, next)?.status === "live";
    action = { label: `${live ? "Continue" : "Start"} ${ROUND_SHORT[next]}`, view: "interview" };
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-[18px]">
      <Orb tone={tone} size="sm" />
      <div className="min-w-[200px] flex-1">
        <span className="eyebrow">Up next</span>
        <h3 className="my-1 text-[17px] font-semibold">{title}</h3>
        <p className="text-[12.5px] text-ink-2">{copy}</p>
      </div>
      <Btn variant="primary" onClick={() => goTo(action.view)}>{action.label} <ArrowRight /></Btn>
    </div>
  );
}

function LatestFeedback({ rounds, goTo }: { rounds: SessionRound[]; goTo: GoTo }) {
  const last = rounds
    .filter((r) => r.is_current && r.status === "completed")
    .sort((a, b) => (a.ended_at ?? "").localeCompare(b.ended_at ?? ""))
    .pop();
  return (
    <Card title="Latest feedback" right={last && <Pill tone={ROUND_TONE[last.round]}>{ROUND_SHORT[last.round]}</Pill>}>
      {last ? (
        <>
          {last.strengths.slice(0, 1).map((s) => <FeedbackRow key={s} mark="+" tone="sage" text={s} />)}
          {last.gaps.slice(0, 1).map((g) => <FeedbackRow key={g.text} mark="!" tone="rose" text={g.text} />)}
          <Btn variant="ghost" className="px-0 py-2 text-[12.5px]" onClick={() => goTo("interview")}>Open round report →</Btn>
        </>
      ) : (
        <p className="text-[12.5px] text-ink-2">Feedback from each round shows up here as soon as it ends.</p>
      )}
    </Card>
  );
}

function FeedbackRow({ mark, tone, text }: { mark: string; tone: "sage" | "rose"; text: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
      <span className={cn("clay-chip grid size-[34px] shrink-0 place-items-center rounded-[11px] text-[12.5px] font-semibold", tone === "sage" ? "bg-sage text-sage-ink" : "bg-rose text-rose-ink")}>{mark}</span>
      <span className="flex-1 text-[12.5px]">{text}</span>
    </div>
  );
}

function CheckRow({ done, text, hint, onAdd, primary = false }: { done: boolean; text: string; hint?: string; onAdd: () => void; primary?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-[9px]">
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", done ? "bg-sage text-sage-ink" : "clay-inset")}>{done && <Check className="size-3" strokeWidth={3} />}</span>
      <span className="flex-1 text-[12.5px]">{text}{hint && <span className="text-ink-3"> · {hint}</span>}</span>
      {!done && <Btn variant={primary ? "raised" : "ghost"} className="px-3 py-1.5 text-[12.5px]" onClick={onAdd}>Add</Btn>}
    </div>
  );
}
