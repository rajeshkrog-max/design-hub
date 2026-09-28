import type { RoundKey, RoundResult } from "@/types/arena";

export const ROUND_ORDER: RoundKey[] = ["screening", "hr_bp", "functional", "ceo"];
export const REQUIRED_PROFILE_SECTIONS = ["personal", "education", "skills", "preferences"] as const;

export function canStartInterview(completed: string[]) {
  return REQUIRED_PROFILE_SECTIONS.every((section) => completed.includes(section));
}

export function canUnlockCeo(rounds: RoundResult[], threshold = 65) {
  const scores = rounds
    .filter((item) => item.round !== "ceo" && item.score !== null)
    .map((item) => item.score as number);
  return scores.length === 3 && scores.reduce((total, score) => total + score, 0) / 3 >= threshold;
}

export function canRetry(round: RoundResult) {
  return round.verdict === "needs_improvement" && round.try_no === 1;
}

export function canResume(round: RoundResult) {
  return !round.resume_used;
}

export function canPrintCv(allRoundsDone: boolean, offerAccepted: boolean) {
  return allRoundsDone && offerAccepted;
}

export function profileTier(score: number) {
  if (score >= 80) return { name: "Strong", match: "Product MNCs and top firms", ctc: "6–10 LPA" };
  if (score >= 50) return { name: "Good", match: "Mid-size firms and IT services", ctc: "4–6 LPA" };
  return { name: "Starter", match: "Startups and smaller firms", ctc: "2.5–4 LPA" };
}