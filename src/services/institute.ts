import { getStore, nextId, persist } from "@/data/mock/store";
import { deriveStudent, logAudit } from "./student";
import type { Batch, SessionUser, Student, StudentDerived } from "@/types/arena";

function requireInstitute(user: SessionUser) {
  if (user.role !== "institute") throw new Error("Institute access required");
  const store = getStore();
  const institute = store.institutes.find((i) => i.id === user.institute_id);
  if (!institute) throw new Error("Institute not found");
  const staff = store.institute_users.find((u) => u.id === user.institute_user_id);
  return { institute, staff, store };
}

function scopedStudents(user: SessionUser): Student[] {
  return getStore().students.filter((s) => s.institute_id === user.institute_id);
}

export function getInstituteOverview(user: SessionUser) {
  const { institute, store } = requireInstitute(user);
  const students = scopedStudents(user).map(deriveStudent);
  const total = students.length || 1;
  const count = (fn: (d: StudentDerived) => boolean) => students.filter(fn).length;
  const funnel = [
    { label: "Invited", value: count(() => true) },
    { label: "Profile done", value: count((d) => !!d.profile?.required_complete) },
    { label: "Screening", value: count((d) => d.rounds.some((r) => r.round === "screening" && r.status === "completed")) },
    { label: "HR BP", value: count((d) => d.rounds.some((r) => r.round === "hr_bp" && r.status === "completed")) },
    { label: "Functional", value: count((d) => d.rounds.some((r) => r.round === "functional" && r.status === "completed")) },
    { label: "CEO unlocked", value: count((d) => !!d.session?.ceo_unlocked) },
    { label: "Offer accepted", value: count((d) => d.offer?.decision === "accepted") },
  ].map((f) => ({ ...f, pct: Math.round((f.value / total) * 100) }));

  const bands = { strong: 0, good: 0, starter: 0 };
  for (const d of students) {
    const score = d.profile?.strength_score ?? 0;
    if (score >= 80) bands.strong += 1;
    else if (score >= 50) bands.good += 1;
    else bands.starter += 1;
  }

  return {
    institute,
    batches: store.batches.filter((b) => b.institute_id === user.institute_id),
    students,
    funnel,
    bands,
    pendingRestarts: store.restart_requests.filter(
      (r) => r.institute_id === user.institute_id && r.status === "pending",
    ),
    activity: store.audit_log
      .filter((a) => a.institute_id === user.institute_id)
      .slice(-8)
      .reverse(),
  };
}

export interface StudentFilters {
  batch?: string;
  status?: string;
  round?: string;
  verdict?: string;
  band?: string;
  weakArea?: string;
  search?: string;
}

export function listStudents(user: SessionUser, filters: StudentFilters = {}): StudentDerived[] {
  requireInstitute(user);
  let list = scopedStudents(user).map(deriveStudent);
  if (filters.batch) list = list.filter((d) => d.student.batch_id === filters.batch);
  if (filters.status) list = list.filter((d) => d.student.status === filters.status);
  if (filters.round) list = list.filter((d) => d.current_round === filters.round);
  if (filters.verdict) list = list.filter((d) => d.verdict === filters.verdict);
  if (filters.band) {
    list = list.filter((d) => {
      const s = d.profile?.strength_score ?? 0;
      return filters.band === "strong" ? s >= 80 : filters.band === "good" ? s >= 50 && s < 80 : s < 50;
    });
  }
  if (filters.weakArea) list = list.filter((d) => d.weak_area.includes(filters.weakArea!));
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((d) => d.student.name.toLowerCase().includes(q) || d.student.email.includes(q));
  }
  return list;
}

export function getStudentDetail(user: SessionUser, studentId: string): StudentDerived {
  requireInstitute(user);
  const student = getStore().students.find((s) => s.id === studentId);
  if (!student || student.institute_id !== user.institute_id) {
    throw new Error("You don't have access");
  }
  return deriveStudent(student);
}

export function decideRestart(user: SessionUser, requestId: string, decision: "approved" | "declined") {
  const { staff, store } = requireInstitute(user);
  if (staff?.role !== "admin") throw new Error("Only admins can decide restarts");
  const request = store.restart_requests.find((r) => r.id === requestId);
  if (!request || request.institute_id !== user.institute_id) throw new Error("You don't have access");
  request.status = decision;
  request.decided_by = staff?.id ?? user.auth_user_id;
  request.decided_at = new Date().toISOString();
  if (decision === "approved") {
    const old = store.interview_sessions.find((s) => s.id === request.session_id);
    if (old) {
      old.status = "restarted";
      store.interview_sessions.push({
        id: nextId("session"),
        institute_id: old.institute_id,
        student_id: old.student_id,
        attempt_no: old.attempt_no + 1,
        company_profile_id: null,
        company_options: [],
        context: "",
        status: "in_progress",
        average_score: null,
        ceo_unlocked: false,
        started_at: new Date().toISOString(),
        completed_at: null,
      });
      request.status = "used";
    }
  }
  logAudit(user, `restart_${decision}`, "restart_request", requestId);
  persist();
}

export function getBatchReport(user: SessionUser, batchId: string) {
  requireInstitute(user);
  const store = getStore();
  const batch = store.batches.find((b) => b.id === batchId);
  if (!batch || batch.institute_id !== user.institute_id) throw new Error("You don't have access");
  logAudit(user, "view_batch_report", "batch", batchId);
  const students = store.students.filter((s) => s.batch_id === batchId).map(deriveStudent);
  return { batch, students };
}

export function getIndividualReport(user: SessionUser, studentId: string) {
  const detail = getStudentDetail(user, studentId);
  const store = getStore();
  logAudit(user, "view_individual_report", "student", studentId);
  return {
    ...detail,
    gaps: detail.session ? store.gap_diagnoses.filter((g) => g.session_id === detail.session!.id) : [],
    report: detail.session ? (store.reports.find((r) => r.session_id === detail.session!.id) ?? null) : null,
    attempts: store.interview_sessions.filter((s) => s.student_id === studentId),
  };
}

export function exportStudentsCsv(user: SessionUser, studentIds: string[]): string {
  requireInstitute(user);
  const rows = scopedStudents(user)
    .filter((s) => studentIds.includes(s.id))
    .map(deriveStudent);
  logAudit(user, "export_students_csv", "student", studentIds.join(","));
  const header = "Name,Email,Batch,Status,State,Readiness,Verdict,Weak area";
  const lines = rows.map((d) =>
    [d.student.name, d.student.email, d.student.batch_id, d.student.status, d.state_label, d.readiness, d.verdict, d.weak_area]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export function addRosterRows(user: SessionUser, batchId: string, rows: Array<{ name: string; email: string }>): number {
  const { store } = requireInstitute(user);
  const batch = store.batches.find((b) => b.id === batchId);
  if (!batch || batch.institute_id !== user.institute_id) throw new Error("You don't have access");
  let added = 0;
  for (const row of rows) {
    if (!row.name || !row.email) continue;
    store.students.push({
      id: nextId("student"),
      institute_id: user.institute_id,
      batch_id: batchId,
      auth_user_id: null,
      email: row.email,
      name: row.name,
      photo_url: null,
      status: "invited",
      consent_at: null,
      created_at: new Date().toISOString(),
    });
    added += 1;
  }
  persist();
  return added;
}

export function getAnalytics(user: SessionUser) {
  requireInstitute(user);
  const students = scopedStudents(user).map(deriveStudent);
  const total = students.length || 1;

  const weakCounts = new Map<string, number>();
  for (const d of students) {
    for (const r of d.rounds) for (const g of r.gaps) weakCounts.set(g.text, (weakCounts.get(g.text) ?? 0) + 1);
  }
  const weakAreas = [...weakCounts.entries()]
    .map(([text, n]) => ({ text, pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  const roundNames = ["screening", "hr_bp", "functional", "ceo"] as const;
  const passRates = roundNames.map((round) => {
    const done = students.flatMap((d) => d.rounds.filter((r) => r.round === round && r.is_current && r.status === "completed"));
    const passed = done.filter((r) => r.verdict === "passed").length;
    return { round, passRate: done.length ? Math.round((passed / done.length) * 100) : 0, avg: done.length ? Math.round(done.reduce((a, r) => a + (r.score ?? 0), 0) / done.length) : 0 };
  });

  const distribution = [0, 0, 0, 0, 0];
  for (const d of students) {
    const s = Math.min(99, d.readiness);
    distribution[Math.floor(s / 20)]! += 1;
  }

  const retried = students.flatMap((d) => {
    const tries = d.rounds.filter((r) => !r.is_current && r.verdict === "needs_improvement");
    return tries.map((t) => {
      const next = d.rounds.find((r) => r.round === t.round && r.try_no === 2);
      return { student: d.student.name, round: t.round, from: t.score ?? 0, to: next?.score ?? 0 };
    });
  });

  const sectors = new Map<string, number>();
  for (const d of students) {
    const pref = d.profile?.preferences?.role;
    if (pref) sectors.set(pref, (sectors.get(pref) ?? 0) + 1);
  }

  const sorted = [...students].sort((a, b) => b.readiness - a.readiness);
  return {
    weakAreas,
    passRates,
    distribution,
    retried,
    sectors: [...sectors.entries()].map(([role, n]) => ({ role, count: n })),
    top: sorted.slice(0, 5),
    attention: sorted.slice(-5).reverse(),
  };
}

export function getSettings(user: SessionUser) {
  const { institute, staff, store } = requireInstitute(user);
  return {
    institute,
    me: staff ?? null,
    team: store.institute_users.filter((u) => u.institute_id === user.institute_id),
  };
}

export function listBatches(user: SessionUser): Array<Batch & { student_count: number; completed: number }> {
  requireInstitute(user);
  const store = getStore();
  return store.batches
    .filter((b) => b.institute_id === user.institute_id)
    .map((b) => {
      const members = store.students.filter((s) => s.batch_id === b.id).map(deriveStudent);
      return {
        ...b,
        student_count: members.length,
        completed: members.filter((d) => d.session?.status === "completed").length,
      };
    });
}
