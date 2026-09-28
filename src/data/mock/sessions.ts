import type { InterviewSession, RoundKey, RoundVerdict, SessionRound, SessionStatus } from "@/types/arena";
import { ROUND_PERSONAS } from "@/lib/rules";
import { roundFeedback } from "./feedback";
import { profiles } from "./profiles";
import { students } from "./students";

const DAY = 86400000;
const T0 = Date.parse("2026-09-01T09:00:00Z");
const ts = (days: number, hours = 0) => new Date(T0 + days * DAY + hours * 3600000).toISOString();

let seq = 0;
const rid = (prefix: string) => `${prefix}-${++seq}`;

interface RoundSpec {
  round: RoundKey;
  status: SessionRound["status"];
  score?: number;
  verdict?: RoundVerdict;
  try_no?: 1 | 2;
  is_current?: boolean;
  progress?: number;
  resume_used?: boolean;
  disconnects?: number;
}

function makeRound(session: InterviewSession, spec: RoundSpec): SessionRound {
  const done = spec.status === "completed";
  return {
    id: rid("round"),
    institute_id: session.institute_id,
    session_id: session.id,
    round: spec.round,
    try_no: spec.try_no ?? 1,
    is_current: spec.is_current ?? true,
    persona: ROUND_PERSONAS[spec.round].name,
    retell_agent_id: null,
    retell_call_id: null,
    status: spec.status,
    progress_pct: spec.progress ?? (done ? 100 : 0),
    score: spec.score ?? null,
    verdict: spec.verdict ?? null,
    ...(done ? roundFeedback(spec.round, spec.score ?? 60) : { rubric: [], strengths: [], gaps: [], improve: [] }),
    expertise: done ? ["Fundamentals"] : [],
    notes_for_next: done ? "Probe SQL depth and trade-offs." : "",
    transcript_key: done ? `tr/${session.id}/${spec.round}` : null,
    resume_used: spec.resume_used ?? false,
    disconnect_count: spec.disconnects ?? 0,
    duration_sec: done ? 300 + (seq % 5) * 60 : 0,
    started_at: done || spec.status === "live" ? ts(10, seq % 8) : null,
    ended_at: done ? ts(10, (seq % 8) + 1) : null,
  };
}

function makeSession(studentIndex: number, status: SessionStatus, opts: Partial<InterviewSession> = {}): InterviewSession {
  const student = students[studentIndex]!;
  return {
    id: rid("session"),
    institute_id: student.institute_id,
    student_id: student.id,
    attempt_no: 1,
    company_profile_id: null,
    company_options: [],
    context: "",
    status,
    average_score: null,
    ceo_unlocked: false,
    started_at: ts(10),
    completed_at: status === "completed" ? ts(14) : null,
    ...opts,
  };
}

function companyFor(studentIndex: number): string {
  const tier = profiles[studentIndex]!.strength_tier;
  return tier === "Strong" ? "co-s1" : tier === "Good" ? "co-g1" : "co-t1";
}

export const sessions: InterviewSession[] = [];
export const rounds: SessionRound[] = [];

function add(studentIndex: number, status: SessionStatus, specs: RoundSpec[], extra: Partial<InterviewSession> = {}) {
  const s = makeSession(studentIndex, status, extra);
  sessions.push(s);
  for (const spec of specs) rounds.push(makeRound(s, spec));
  return s;
}

// 1: not started, profile incomplete → no session
// 2: profile done, not interviewed → no session
// 3: mid screening
add(2, "in_progress", [{ round: "screening", status: "live", progress: 45 }], { company_profile_id: companyFor(2) });
// 4: passed screening, mid aptitude
add(3, "in_progress", [
  { round: "screening", status: "completed", score: 72, verdict: "passed" },
  { round: "aptitude", status: "live", progress: 30 },
], { company_profile_id: companyFor(3) });
// 5: failed HR BP, retry available
add(4, "in_progress", [
  { round: "screening", status: "completed", score: 70, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 66, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 52, verdict: "needs_improvement" },
], { company_profile_id: companyFor(4) });
// 6: failed HR BP, retried and passed; CEO unlocked
{
  const s = add(5, "in_progress", [
    { round: "screening", status: "completed", score: 74, verdict: "passed" },
    { round: "aptitude", status: "completed", score: 68, verdict: "passed" },
    { round: "hr_bp", status: "completed", score: 55, verdict: "needs_improvement", try_no: 1, is_current: false },
    { round: "hr_bp", status: "completed", score: 71, verdict: "passed", try_no: 2 },
    { round: "ceo", status: "ready" },
  ], { company_profile_id: companyFor(5), ceo_unlocked: true, average_score: 71 });
  s.average_score = 71;
}
// 7: disconnected once, resume available (mid HR BP)
add(6, "in_progress", [
  { round: "screening", status: "completed", score: 69, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 67, verdict: "passed" },
  { round: "hr_bp", status: "live", progress: 55, disconnects: 1 },
], { company_profile_id: companyFor(6) });
// 8: resume used, HR BP incomplete
add(7, "in_progress", [
  { round: "screening", status: "completed", score: 65, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 64, verdict: "passed" },
  { round: "hr_bp", status: "incomplete", progress: 70, resume_used: true, disconnects: 2 },
], { company_profile_id: companyFor(7) });
// 9: HR BP done, average 64: CEO cannot be unlocked
add(8, "in_progress", [
  { round: "screening", status: "completed", score: 66, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 62, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 64, verdict: "passed" },
], { company_profile_id: companyFor(8), average_score: 64 });
// 10: CEO unlocked, offer pending
add(9, "completed", [
  { round: "screening", status: "completed", score: 76, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 70, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 72, verdict: "passed" },
  { round: "ceo", status: "completed", score: 74, verdict: "passed" },
], { company_profile_id: companyFor(9), ceo_unlocked: true, average_score: 73 });
// 11: offer accepted
add(10, "completed", [
  { round: "screening", status: "completed", score: 80, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 75, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 78, verdict: "passed" },
  { round: "ceo", status: "completed", score: 81, verdict: "passed" },
], { company_profile_id: companyFor(10), ceo_unlocked: true, average_score: 78.5 });
// 12: offer declined
add(11, "completed", [
  { round: "screening", status: "completed", score: 71, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 69, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 68, verdict: "passed" },
  { round: "ceo", status: "completed", score: 70, verdict: "passed" },
], { company_profile_id: companyFor(11), ceo_unlocked: true, average_score: 69.5 });
// 13: restart requested pending (completed session, weak scores)
add(12, "completed", [
  { round: "screening", status: "completed", score: 61, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 58, verdict: "needs_improvement" },
  { round: "hr_bp", status: "completed", score: 55, verdict: "needs_improvement" },
], { company_profile_id: companyFor(12), average_score: 58 });
// 14: restart approved
add(13, "completed", [
  { round: "screening", status: "completed", score: 60, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 57, verdict: "needs_improvement" },
], { company_profile_id: companyFor(13), average_score: 58.5 });
// 15–25: variety
add(14, "in_progress", [{ round: "screening", status: "completed", score: 77, verdict: "passed" }, { round: "aptitude", status: "ready" }], { company_profile_id: companyFor(14) });
add(15, "in_progress", [
  { round: "screening", status: "completed", score: 73, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 71, verdict: "passed" },
  { round: "hr_bp", status: "ready" },
], { company_profile_id: companyFor(15) });
add(16, "completed", [
  { round: "screening", status: "completed", score: 68, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 67, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 66, verdict: "passed" },
  { round: "ceo", status: "completed", score: 69, verdict: "passed" },
], { company_profile_id: companyFor(16), ceo_unlocked: true, average_score: 67.5 });
// students 18–25 (bloom, indexes 17–24)
add(17, "in_progress", [{ round: "screening", status: "live", progress: 60 }], { company_profile_id: companyFor(17) });
add(18, "in_progress", [
  { round: "screening", status: "completed", score: 74, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 70, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 58, verdict: "needs_improvement" },
], { company_profile_id: companyFor(18) });
add(19, "completed", [
  { round: "screening", status: "completed", score: 79, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 76, verdict: "passed" },
  { round: "hr_bp", status: "completed", score: 74, verdict: "passed" },
  { round: "ceo", status: "completed", score: 78, verdict: "passed" },
], { company_profile_id: companyFor(19), ceo_unlocked: true, average_score: 76.8 });
add(20, "in_progress", [{ round: "screening", status: "completed", score: 63, verdict: "passed" }, { round: "aptitude", status: "ready" }], { company_profile_id: companyFor(20) });
add(21, "completed", [
  { round: "screening", status: "completed", score: 62, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 59, verdict: "needs_improvement" },
], { company_profile_id: companyFor(21), average_score: 60.5 });
// indexes 22–24: no session yet (profile done / not interviewed variety)
// Riya (index 0, the demo student): screening and aptitude passed, HR BP up next. Added last so
// the session indexes above (used by offers.ts) stay the same.
export const demoSession = add(0, "in_progress", [
  { round: "screening", status: "completed", score: 71, verdict: "passed" },
  { round: "aptitude", status: "completed", score: 73, verdict: "passed" },
  { round: "hr_bp", status: "ready" },
], { company_profile_id: companyFor(0) });
