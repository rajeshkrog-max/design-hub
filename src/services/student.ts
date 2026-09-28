import { getStore, nextId, persist } from "@/data/mock/store";
import { aptitudeQuestions } from "@/data/mock/aptitude";
import {
  ROUND_ORDER, canRequestRestart, canResume, canRetry, ceoUnlocked, currentAverage,
  currentRound, profileStrength, profileTier, reportsUnlocked,
} from "@/lib/rules";
import type {
  AptitudeAttempt, CompanyProfile, InterviewSession, Offer, ProfileSectionKey,
  RoundKey, SessionRound, SessionUser, Student, StudentProfile, StudentDerived,
} from "@/types/arena";

function requireStudent(user: SessionUser): Student {
  if (user.role !== "student" || !user.student_id) throw new Error("Student access required");
  const student = getStore().students.find((s) => s.id === user.student_id);
  if (!student) throw new Error("Student not found");
  if (student.institute_id !== user.institute_id) throw new Error("You don't have access");
  return student;
}

export function logAudit(
  user: SessionUser,
  action: string,
  target_type: string,
  target_id: string,
) {
  getStore().audit_log.push({
    id: nextId("audit"),
    institute_id: user.institute_id,
    actor_id: user.student_id ?? user.institute_user_id ?? user.auth_user_id,
    actor_type: user.role,
    action,
    target_type,
    target_id,
    at: new Date().toISOString(),
  });
  persist();
}

export function getMyProfile(user: SessionUser): StudentProfile | null {
  const student = requireStudent(user);
  return getStore().student_profiles.find((p) => p.student_id === student.id) ?? null;
}

export function saveProfileSection(
  user: SessionUser,
  section: ProfileSectionKey,
  value: unknown,
): StudentProfile {
  const student = requireStudent(user);
  const store = getStore();
  let profile = store.student_profiles.find((p) => p.student_id === student.id);
  if (!profile) {
    profile = {
      student_id: student.id,
      institute_id: student.institute_id,
      personal: null, education: null, skills: null, preferences: null, summary: null,
      experience: [], projects: [], certifications: [], achievements: [], activities: [], languages: [],
      strength_score: 0, strength_tier: "Starter", required_complete: false,
      cv_file_key: null, cv_extracted: false, updated_at: new Date().toISOString(),
    };
    store.student_profiles.push(profile);
  }
  (profile as unknown as Record<string, unknown>)[section] = value;
  profile.strength_score = profileStrength(profile);
  profile.strength_tier = profileTier(profile.strength_score).name;
  profile.required_complete = ["personal", "education", "skills", "preferences"].every(
    (key) => (profile as unknown as Record<string, unknown>)[key] != null,
  );
  profile.updated_at = new Date().toISOString();
  persist();
  return profile;
}

export function markCvUploaded(user: SessionUser, fileKey: string): StudentProfile {
  const student = requireStudent(user);
  const store = getStore();
  const profile = store.student_profiles.find((p) => p.student_id === student.id);
  if (!profile) throw new Error("Profile not found");
  profile.cv_file_key = fileKey;
  profile.cv_extracted = true;
  profile.updated_at = new Date().toISOString();
  persist();
  return profile;
}

export function getMySession(user: SessionUser): {
  session: InterviewSession | null;
  rounds: SessionRound[];
  offer: Offer | null;
  company: CompanyProfile | null;
} {
  const student = requireStudent(user);
  const store = getStore();
  const session =
    store.interview_sessions
      .filter((s) => s.student_id === student.id)
      .sort((a, b) => b.attempt_no - a.attempt_no)[0] ?? null;
  if (!session) return { session: null, rounds: [], offer: null, company: null };
  if (session.institute_id !== user.institute_id) throw new Error("You don't have access");
  const rounds = store.session_rounds.filter((r) => r.session_id === session.id);
  const offer = store.offers.find((o) => o.session_id === session.id) ?? null;
  const company = store.company_profiles.find((c) => c.id === session.company_profile_id) ?? null;
  return { session, rounds, offer, company };
}

export function getCompanyOptions(user: SessionUser): CompanyProfile[] {
  const student = requireStudent(user);
  const profile = getStore().student_profiles.find((p) => p.student_id === student.id);
  const tier = profile?.strength_tier ?? "Starter";
  return getStore().company_profiles.filter((c) => c.tier === tier);
}

export function chooseCompany(user: SessionUser, companyId: string): InterviewSession {
  const student = requireStudent(user);
  const store = getStore();
  const company = store.company_profiles.find((c) => c.id === companyId);
  if (!company) throw new Error("Company not found");
  let session = store.interview_sessions
    .filter((s) => s.student_id === student.id && s.status === "in_progress")
    .sort((a, b) => b.attempt_no - a.attempt_no)[0];
  if (!session) {
    session = {
      id: nextId("session"),
      institute_id: student.institute_id,
      student_id: student.id,
      attempt_no: 1,
      company_profile_id: null,
      company_options: [],
      context: "",
      status: "in_progress",
      average_score: null,
      ceo_unlocked: false,
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    store.interview_sessions.push(session);
  }
  if (session.company_profile_id) throw new Error("Company already chosen for this attempt");
  session.company_profile_id = companyId;
  session.company_options = getCompanyOptions(user).map((c) => c.id);
  persist();
  return session;
}

export function startRound(user: SessionUser, round: RoundKey): SessionRound {
  const student = requireStudent(user);
  const store = getStore();
  const session = store.interview_sessions
    .filter((s) => s.student_id === student.id && s.status === "in_progress")
    .sort((a, b) => b.attempt_no - a.attempt_no)[0];
  if (!session) throw new Error("No active session");
  const existing = store.session_rounds.find(
    (r) => r.session_id === session.id && r.round === round && r.is_current,
  );
  if (existing && existing.status !== "locked") {
    existing.status = "live";
    existing.started_at = existing.started_at ?? new Date().toISOString();
    persist();
    return existing;
  }
  const row: SessionRound = {
    id: nextId("round"),
    institute_id: student.institute_id,
    session_id: session.id,
    round,
    try_no: 1,
    is_current: true,
    persona: { screening: "Sera", hr_bp: "Ananya (HR BP)", functional: "Rahul (Panel)", ceo: "CEO" }[round],
    retell_agent_id: null,
    retell_call_id: null,
    status: "live",
    progress_pct: 0,
    score: null,
    verdict: null,
    rubric: [],
    strengths: [],
    gaps: [],
    expertise: [],
    notes_for_next: "",
    transcript_key: null,
    resume_used: false,
    disconnect_count: 0,
    duration_sec: 0,
    started_at: new Date().toISOString(),
    ended_at: null,
  };
  store.session_rounds.push(row);
  persist();
  return row;
}

function findRound(user: SessionUser, roundId: string): SessionRound {
  const student = requireStudent(user);
  const round = getStore().session_rounds.find((r) => r.id === roundId);
  if (!round || round.institute_id !== student.institute_id) throw new Error("You don't have access");
  return round;
}

export function endRound(user: SessionUser, roundId: string, score?: number): SessionRound {
  const round = findRound(user, roundId);
  const store = getStore();
  const finalScore = score ?? 55 + Math.floor(Math.random() * 35);
  round.status = "completed";
  round.progress_pct = 100;
  round.score = finalScore;
  round.verdict = finalScore >= 60 ? "passed" : "needs_improvement";
  round.ended_at = new Date().toISOString();
  round.transcript_key = `tr/${round.session_id}/${round.round}`;
  round.rubric = [
    { label: "Clarity", score: Math.min(100, finalScore + 6) },
    { label: "Structure", score: Math.max(20, finalScore - 8) },
    { label: "Depth", score: finalScore },
  ];
  round.strengths = ["Clear examples", "Calm delivery"];
  round.gaps =
    round.verdict === "needs_improvement"
      ? [{ text: "Answer lacked structure", timestamp: "02:41" }]
      : [];
  round.notes_for_next = "Probe depth on the weak areas noted above.";

  const session = store.interview_sessions.find((s) => s.id === round.session_id)!;
  const institute = store.institutes.find((i) => i.id === session.institute_id)!;
  const rounds = store.session_rounds.filter((r) => r.session_id === session.id);
  const avg = currentAverage(rounds);
  session.average_score = avg;
  session.ceo_unlocked = ceoUnlocked(rounds, institute);
  if (round.round === "ceo") {
    session.status = "completed";
    session.completed_at = new Date().toISOString();
    store.offers.push({
      id: nextId("offer"),
      institute_id: session.institute_id,
      session_id: session.id,
      role: "Graduate trainee",
      ctc: "5.5 LPA",
      joining: "Jul 2027",
      decision: "pending",
      decided_at: null,
    });
  }
  persist();
  return round;
}

export function recordDisconnect(user: SessionUser, roundId: string): SessionRound {
  const round = findRound(user, roundId);
  round.disconnect_count += 1;
  if (round.resume_used || round.disconnect_count > 1) {
    // second disconnect ends the round as incomplete
    round.status = "incomplete";
    round.ended_at = new Date().toISOString();
  }
  persist();
  return round;
}

export function resumeRound(user: SessionUser, roundId: string): SessionRound {
  const round = findRound(user, roundId);
  if (!canResume(round)) throw new Error("Resume not available");
  round.resume_used = true;
  round.status = "live";
  persist();
  return round;
}

export function retryRound(user: SessionUser, roundId: string): SessionRound {
  const old = findRound(user, roundId);
  if (!canRetry(old)) throw new Error("Retry not available");
  const store = getStore();
  old.is_current = false;
  const fresh: SessionRound = {
    ...old,
    id: nextId("round"),
    try_no: 2,
    is_current: true,
    status: "ready",
    progress_pct: 0,
    score: null,
    verdict: null,
    rubric: [],
    strengths: [],
    gaps: [],
    started_at: null,
    ended_at: null,
  };
  store.session_rounds.push(fresh);
  persist();
  return fresh;
}

export function submitAptitude(
  user: SessionUser,
  roundId: string,
  answers: Record<string, number | string>,
): AptitudeAttempt {
  const round = findRound(user, roundId);
  const store = getStore();
  let correct = 0;
  for (const q of aptitudeQuestions) {
    if (q.kind === "mcq" && answers[q.id] === q.correct) correct += 1;
  }
  const attempt: AptitudeAttempt = {
    id: nextId("apt"),
    institute_id: round.institute_id,
    round_id: roundId,
    questions: aptitudeQuestions,
    answers,
    mcq_score: correct,
    written_feedback: "Written answers show clear thinking; tighten structure.",
    submitted_at: new Date().toISOString(),
  };
  store.aptitude_attempts.push(attempt);
  persist();
  return attempt;
}

export function decideOffer(user: SessionUser, offerId: string, decision: "accepted" | "declined"): Offer {
  const student = requireStudent(user);
  const store = getStore();
  const offer = store.offers.find((o) => o.id === offerId);
  if (!offer || offer.institute_id !== student.institute_id) throw new Error("You don't have access");
  offer.decision = decision;
  offer.decided_at = new Date().toISOString();
  persist();
  return offer;
}

export function requestRestart(user: SessionUser, reason: string) {
  const student = requireStudent(user);
  const store = getStore();
  const session = store.interview_sessions
    .filter((s) => s.student_id === student.id)
    .sort((a, b) => b.attempt_no - a.attempt_no)[0];
  if (!session) throw new Error("No session to restart");
  const rounds = store.session_rounds.filter((r) => r.session_id === session.id);
  const institute = store.institutes.find((i) => i.id === session.institute_id)!;
  const pending = store.restart_requests.some(
    (r) => r.student_id === student.id && r.status === "pending",
  );
  if (!canRequestRestart(session, rounds, institute, pending)) {
    throw new Error("Restart is not available right now");
  }
  store.restart_requests.push({
    id: nextId("rr"),
    institute_id: student.institute_id,
    student_id: student.id,
    session_id: session.id,
    reason,
    status: "pending",
    decided_by: null,
    decided_at: null,
    created_at: new Date().toISOString(),
  });
  persist();
}

export function getMyReport(user: SessionUser) {
  const student = requireStudent(user);
  const store = getStore();
  const session = store.interview_sessions
    .filter((s) => s.student_id === student.id)
    .sort((a, b) => b.attempt_no - a.attempt_no)[0];
  if (!session) return null;
  const rounds = store.session_rounds.filter((r) => r.session_id === session.id);
  const institute = store.institutes.find((i) => i.id === session.institute_id)!;
  if (!reportsUnlocked(session, rounds, institute)) return null;
  logAudit(user, "view_report", "session", session.id);
  return {
    session,
    rounds,
    gaps: store.gap_diagnoses.filter((g) => g.session_id === session.id),
    report: store.reports.find((r) => r.session_id === session.id) ?? null,
    offer: store.offers.find((o) => o.session_id === session.id) ?? null,
    attempts: store.interview_sessions.filter((s) => s.student_id === student.id),
  };
}

export function getMyResources(user: SessionUser) {
  const student = requireStudent(user);
  const store = getStore();
  const session = store.interview_sessions
    .filter((s) => s.student_id === student.id)
    .sort((a, b) => b.attempt_no - a.attempt_no)[0];
  const gaps = session ? store.gap_diagnoses.filter((g) => g.session_id === session.id) : [];
  const gapTypes = new Set(gaps.map((g) => g.gap_type));
  return [...store.resources].sort((a, b) => {
    const aMatch = gapTypes.has(a.gap_type) ? 0 : 1;
    const bMatch = gapTypes.has(b.gap_type) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return Number(a.is_paid) - Number(b.is_paid);
  });
}

export function deriveStudent(student: Student): StudentDerived {
  const store = getStore();
  const profile = store.student_profiles.find((p) => p.student_id === student.id) ?? null;
  const session =
    store.interview_sessions
      .filter((s) => s.student_id === student.id)
      .sort((a, b) => b.attempt_no - a.attempt_no)[0] ?? null;
  const rounds = session ? store.session_rounds.filter((r) => r.session_id === session.id) : [];
  const offer = session ? (store.offers.find((o) => o.session_id === session.id) ?? null) : null;
  const restart =
    store.restart_requests
      .filter((r) => r.student_id === student.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const live = rounds.find((r) => r.is_current && r.status === "live");
  const failed = rounds.find((r) => r.is_current && r.verdict === "needs_improvement");
  const lastDone = [...rounds].filter((r) => r.is_current && r.status === "completed").pop();

  let state_label = "Not started";
  if (offer?.decision === "accepted") state_label = "Offer accepted";
  else if (offer?.decision === "declined") state_label = "Offer declined";
  else if (offer) state_label = "Offer pending";
  else if (restart?.status === "pending") state_label = "Restart requested";
  else if (live) state_label = live.disconnect_count > 0 && !live.resume_used ? "Disconnected — resume available" : `In ${live.round.replace("_", " ")} round now`;
  else if (rounds.some((r) => r.is_current && r.status === "incomplete")) state_label = "Round incomplete";
  else if (failed) state_label = canRetry(failed) ? "Waiting for retry" : "Needs improvement";
  else if (session?.status === "completed") state_label = "Completed";
  else if (session) state_label = "In progress";
  else if (profile?.required_complete) state_label = "Profile done";

  const weak = rounds.flatMap((r) => r.gaps.map((g) => g.text))[0] ?? "—";
  return {
    student,
    profile,
    session,
    rounds,
    offer,
    restart,
    state_label,
    current_round: live?.round ?? null,
    last_score: lastDone?.score ?? null,
    verdict: lastDone?.verdict ?? "Not started",
    weak_area: weak,
    readiness: session?.average_score ?? profile?.strength_score ?? 0,
  };
}

export { ROUND_ORDER, currentRound };
