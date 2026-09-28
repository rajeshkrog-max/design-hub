import type {
  Institute, InterviewSession, Offer, PlanKey, ProfileSectionKey, RoundKey, RoundStatus,
  SessionRound, Student, StudentProfile,
} from "@/types/arena";

/** Thresholds a session is judged against: the institute's, or these for independent candidates. */
export type Thresholds = Pick<Institute, "pass_bar" | "ceo_threshold">;
export const INDEPENDENT_THRESHOLDS: Thresholds = { pass_bar: 60, ceo_threshold: 65 };

/** Interview attempts granted to an institute student by the institute deal. */
export const INSTITUTE_CREDITS = 3;

/** Individual plans (independent candidates only; institute students never see prices). */
export const PLANS: Record<PlanKey, { label: string; price_inr: number; credits: number; perks: string[] }> = {
  standard: { label: "Standard", price_inr: 499, credits: 3, perks: ["3 full interview attempts", "Round-by-round reports", "Resource roadmap"] },
  pro: { label: "Pro", price_inr: 999, credits: 8, perks: ["8 full interview attempts", "Everything in Standard", "Print-ready CV templates"] },
};

export function creditsLeft(student: Student): number {
  return Math.max(0, student.credits_total - student.credits_used);
}

/** Screening → aptitude → HR BP → CEO. CEO opens only when the student unlocks it (see canUnlockCeo). */
export const ROUND_ORDER: RoundKey[] = ["screening", "aptitude", "hr_bp", "ceo"];
export const REQUIRED_PROFILE_SECTIONS: ProfileSectionKey[] = ["personal", "education", "skills", "preferences"];

export const ROUND_DURATION_SEC: Record<RoundKey, number> = {
  screening: 5 * 60,
  aptitude: 20 * 60,
  hr_bp: 5 * 60,
  ceo: 5 * 60,
};

/** Aptitude is a timed MCQ test; the other three rounds are voice interviews. */
export const APTITUDE_QUESTION_COUNT = 15;
export const isVoiceRound = (round: RoundKey) => round !== "aptitude";

/** What each round scores. Every metric is judged against the pass bar. */
export const ROUND_CHECKS: Record<RoundKey, string[]> = {
  screening: ["Communication", "Role awareness", "Confidence"],
  aptitude: ["Quant", "Logical", "SQL", "Verbal"],
  hr_bp: ["Culture fit", "CV consistency", "Salary alignment", "Role motivation"],
  ceo: ["Clarity of thought", "Ownership", "Long-term fit"],
};

/** How much each filled profile section adds to profile strength (sums to 100). */
export const SECTION_WEIGHTS: Record<ProfileSectionKey, number> = {
  personal: 16,
  education: 16,
  skills: 16,
  preferences: 12,
  summary: 8,
  experience: 8,
  projects: 8,
  certifications: 6,
  achievements: 4,
  activities: 3,
  languages: 3,
};

function sectionFilled(profile: StudentProfile, key: ProfileSectionKey): boolean {
  const value = profile[key];
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

export function filledSections(profile: StudentProfile): ProfileSectionKey[] {
  return (Object.keys(SECTION_WEIGHTS) as ProfileSectionKey[]).filter((key) => sectionFilled(profile, key));
}

export function profileStrength(profile: StudentProfile): number {
  return filledSections(profile).reduce((total, key) => total + SECTION_WEIGHTS[key], 0);
}

export function profileTier(score: number) {
  if (score >= 80) return { name: "Strong" as const, match: "Product MNCs and top firms", ctc: "6–10 LPA" };
  if (score >= 50) return { name: "Good" as const, match: "Mid-size firms and IT services", ctc: "4–6 LPA" };
  return { name: "Starter" as const, match: "Startups and smaller firms", ctc: "2.5–4 LPA" };
}

export function canStartInterview(profile: StudentProfile | null): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_SECTIONS.every((section) => sectionFilled(profile, section));
}

/** Current row for a round = the one flagged is_current (a retry replaces try 1). */
export function currentRound(rounds: SessionRound[], round: RoundKey): SessionRound | undefined {
  return rounds.find((r) => r.round === round && r.is_current);
}

/** `ceoOpen` is the session's ceo_unlocked flag: the CEO round never opens on its own. */
export function roundStatus(rounds: SessionRound[], round: RoundKey, ceoOpen = false): RoundStatus {
  const row = currentRound(rounds, round);
  if (row) return row.status;
  if (round === "ceo") return ceoOpen ? "ready" : "locked";
  const idx = ROUND_ORDER.indexOf(round);
  const prev = ROUND_ORDER[idx - 1];
  if (!prev) return "ready";
  const prevRow = currentRound(rounds, prev);
  return prevRow?.status === "completed" && prevRow.verdict === "passed" ? "ready" : "locked";
}

export function canRetry(round: SessionRound): boolean {
  return round.verdict === "needs_improvement" && round.try_no === 1 && round.is_current;
}

export function canResume(round: SessionRound): boolean {
  return round.status === "live" && round.disconnect_count > 0 && !round.resume_used;
}

/** Average of current screening, aptitude and HR BP scores (try 2 replaces try 1). */
export function currentAverage(rounds: SessionRound[]): number | null {
  const scores = ROUND_ORDER.slice(0, 3)
    .map((key) => currentRound(rounds, key))
    .filter((r): r is SessionRound => !!r && r.status === "completed" && r.score !== null)
    .map((r) => r.score as number);
  if (scores.length !== 3) return null;
  return scores.reduce((a, b) => a + b, 0) / 3;
}

/** The "Unlock CEO round" button is enabled when HR BP is done and the 3-round average meets the threshold. */
export function canUnlockCeo(rounds: SessionRound[], institute: Thresholds): boolean {
  if (currentRound(rounds, "hr_bp")?.status !== "completed") return false;
  const avg = currentAverage(rounds);
  return avg !== null && avg >= institute.ceo_threshold;
}

/** Share of the four-round journey done, counting a live round's progress. */
export function journeyProgress(rounds: SessionRound[]): number {
  const done = ROUND_ORDER.reduce((sum, key) => {
    const row = currentRound(rounds, key);
    if (row?.status === "completed") return sum + 1;
    if (row?.status === "live") return sum + row.progress_pct / 100;
    return sum;
  }, 0);
  return Math.round((done / ROUND_ORDER.length) * 100);
}

export function allRoundsDone(rounds: SessionRound[]): boolean {
  return ROUND_ORDER.every((key) => {
    const row = currentRound(rounds, key);
    return row?.status === "completed";
  });
}

/** Student can go no further: incomplete round, or HR BP done with the average below the CEO threshold. */
export function stuck(session: InterviewSession, rounds: SessionRound[], institute: Thresholds): boolean {
  if (session.status !== "in_progress") return false;
  const anyIncomplete = rounds.some((r) => r.is_current && r.status === "incomplete");
  if (anyIncomplete) return true;
  const hrDone = currentRound(rounds, "hr_bp")?.status === "completed";
  if (hrDone && !session.ceo_unlocked && !canUnlockCeo(rounds, institute)) return true;
  const anyFailed = ROUND_ORDER.some((key) => {
    const row = currentRound(rounds, key);
    return row?.verdict === "needs_improvement" && !canRetry(row);
  });
  return anyFailed;
}

export function reportsUnlocked(session: InterviewSession, rounds: SessionRound[], institute: Thresholds): boolean {
  return session.status === "completed" || stuck(session, rounds, institute);
}

export function canRequestRestart(
  session: InterviewSession,
  rounds: SessionRound[],
  institute: Thresholds,
  pending: boolean,
): boolean {
  if (pending) return false;
  return session.status === "completed" || stuck(session, rounds, institute);
}

export function canPrintCv(rounds: SessionRound[], offer: Offer | null): boolean {
  return allRoundsDone(rounds) && offer?.decision === "accepted";
}

export const ROUND_LABELS: Record<RoundKey, string> = {
  screening: "Sera screening",
  aptitude: "Aptitude",
  hr_bp: "HR BP round",
  ceo: "CEO round",
};

/** Who runs each voice round. Aptitude has no interviewer. */
export const ROUND_PERSONAS: Record<RoundKey, { name: string; role: string }> = {
  screening: { name: "Sera", role: "AI screener" },
  aptitude: { name: "Aptitude test", role: "15 questions · 20 minutes" },
  hr_bp: { name: "Ananya Mehta", role: "HR business partner" },
  ceo: { name: "Maya Rao", role: "Chief executive" },
};
