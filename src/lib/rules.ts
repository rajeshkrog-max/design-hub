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

export const ROUND_ORDER: RoundKey[] = ["screening", "hr_bp", "functional", "ceo"];
export const REQUIRED_PROFILE_SECTIONS: ProfileSectionKey[] = ["personal", "education", "skills", "preferences"];

export const ROUND_DURATION_SEC: Record<RoundKey, number> = {
  screening: 5 * 60,
  hr_bp: 8 * 60,
  functional: 10 * 60,
  ceo: 6 * 60,
};

const SECTION_WEIGHTS: Record<ProfileSectionKey, number> = {
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

export function roundStatus(rounds: SessionRound[], round: RoundKey): RoundStatus {
  const row = currentRound(rounds, round);
  if (row) return row.status;
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

/** Average of current screening, HR BP and functional scores (try 2 replaces try 1). */
export function currentAverage(rounds: SessionRound[]): number | null {
  const scores = ROUND_ORDER.slice(0, 3)
    .map((key) => currentRound(rounds, key))
    .filter((r): r is SessionRound => !!r && r.status === "completed" && r.score !== null)
    .map((r) => r.score as number);
  if (scores.length !== 3) return null;
  return scores.reduce((a, b) => a + b, 0) / 3;
}

export function ceoUnlocked(rounds: SessionRound[], institute: Thresholds): boolean {
  const avg = currentAverage(rounds);
  return avg !== null && avg >= institute.ceo_threshold;
}

export function allRoundsDone(rounds: SessionRound[]): boolean {
  return ROUND_ORDER.every((key) => {
    const row = currentRound(rounds, key);
    return row?.status === "completed";
  });
}

/** Student can go no further: incomplete round, or CEO locked below threshold. */
export function stuck(session: InterviewSession, rounds: SessionRound[], institute: Thresholds): boolean {
  if (session.status !== "in_progress") return false;
  const anyIncomplete = rounds.some((r) => r.is_current && r.status === "incomplete");
  if (anyIncomplete) return true;
  const ceo = currentRound(rounds, "ceo");
  if (ceo?.status === "locked" && !ceoUnlocked(rounds, institute)) return true;
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
  hr_bp: "HR BP round",
  functional: "Functional",
  ceo: "CEO round",
};
