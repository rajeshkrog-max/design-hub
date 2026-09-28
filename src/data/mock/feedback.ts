// Mock round feedback. The backend's scoring model writes these fields later.
import { ROUND_CHECKS } from "@/lib/rules";
import type { RoundKey, SessionRound } from "@/types/arena";

const FEEDBACK: Record<RoundKey, { strengths: string[]; gaps: string[]; improve: string[] }> = {
  screening: {
    strengths: ["Told a project story with real numbers", "Clear on why this role"],
    gaps: ["Closing answer rushed, no clear outcome"],
    improve: ["End answers with the result you got", "Slow down in the last minute"],
  },
  aptitude: {
    strengths: ["Full marks in verbal, strong quant", "Fast: about 1:15 per question"],
    gaps: ["SQL questions on joins went wrong"],
    improve: ["Practise 20 SQL join problems", "Re-check logic questions before moving on"],
  },
  hr_bp: {
    strengths: ["Good fit with the team culture", "CV claims held up under questions"],
    gaps: ["Salary ask was above the band for this role"],
    improve: ["Research the fresher salary band before HR rounds", "Tie your motivation to the company's product"],
  },
  ceo: {
    strengths: ["Owned decisions in your examples", "Clear long-term goal"],
    gaps: ["Hesitated on a trade-off question"],
    improve: ["Practise one crisp answer on a hard trade-off"],
  },
};

/** Rubric, strengths, weak areas and improvements for a finished round with this score. */
export function roundFeedback(round: RoundKey, score: number): Pick<SessionRound, "rubric" | "strengths" | "gaps" | "improve"> {
  const offsets = [6, -4, -10, 3];
  const f = FEEDBACK[round];
  return {
    rubric: ROUND_CHECKS[round].map((label, i) => ({ label, score: Math.max(20, Math.min(100, score + offsets[i % offsets.length]!)) })),
    strengths: f.strengths,
    gaps: score < 60 ? f.gaps.map((text) => ({ text, timestamp: "03:12" })) : f.gaps.slice(0, 1).map((text) => ({ text, timestamp: "03:12" })),
    improve: f.improve,
  };
}
