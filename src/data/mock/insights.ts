import type { AuditLogEntry, BatchReport, Consent, GapDiagnosis, Report, Resource } from "@/types/arena";
import { sessions } from "./sessions";

export const resources: Resource[] = [
  { id: "r1", gap_type: "skill", skill: "SQL", level: "beginner", title: "SQL joins explained visually", url: "https://freecodecamp.org", kind: "article", is_paid: false, is_affiliate: false },
  { id: "r2", gap_type: "skill", skill: "SQL", level: "intermediate", title: "20 SQL interview problems", url: "https://youtube.com", kind: "playlist", is_paid: false, is_affiliate: false },
  { id: "r3", gap_type: "communication", skill: "Structure", level: "beginner", title: "Build answers with STAR", url: "https://yzi.works/star", kind: "guide", is_paid: false, is_affiliate: false },
  { id: "r4", gap_type: "expectation", skill: "Salary", level: "all", title: "Fresher salary bands 2026", url: "https://yzi.works/salary", kind: "guide", is_paid: false, is_affiliate: false },
  { id: "r5", gap_type: "aptitude", skill: "Quant", level: "beginner", title: "Quant aptitude crash course", url: "https://nptel.ac.in", kind: "course", is_paid: false, is_affiliate: false },
  { id: "r6", gap_type: "communication", skill: "Speaking", level: "advanced", title: "Executive speaking lab", url: "https://yzi.academy", kind: "course", is_paid: true, is_affiliate: true },
  { id: "r7", gap_type: "skill", skill: "DSA", level: "intermediate", title: "DSA patterns for interviews", url: "https://yzi.works/dsa", kind: "course", is_paid: true, is_affiliate: false },
  { id: "r8", gap_type: "aptitude", skill: "Logical", level: "intermediate", title: "Logical reasoning drills", url: "https://yzi.works/logic", kind: "practice", is_paid: false, is_affiliate: false },
];

const gapPool: Array<[GapDiagnosis["gap_type"], string, string]> = [
  ["skill", "SQL depth", "Struggled to explain JOIN vs UNION with an example."],
  ["communication", "Answer structure", "Answers wandered; STAR structure missing."],
  ["expectation", "Salary alignment", "Expected CTC well above tier band."],
  ["aptitude", "Quant speed", "MCQ accuracy under 50% on quant topics."],
];

export const gapDiagnoses: GapDiagnosis[] = sessions
  .filter((s) => s.status === "completed")
  .map((s, i) => {
    const [gap_type, title, evidence] = gapPool[i % gapPool.length]!;
    return {
      id: `gap-${i + 1}`,
      institute_id: s.institute_id,
      session_id: s.id,
      gap_type,
      title,
      evidence,
      resource_ids: resources.filter((r) => r.gap_type === gap_type).map((r) => r.id),
    };
  });

export const reports: Report[] = sessions
  .filter((s) => s.status === "completed")
  .map((s, i) => ({
    id: `report-${i + 1}`,
    institute_id: s.institute_id,
    session_id: s.id,
    overall_score: Math.round(s.average_score ?? 60),
    verdict: (s.average_score ?? 0) >= 65 ? "Ready to place" : "Place with training",
    report: {},
    pdf_key: null,
    created_at: "2026-09-15",
  }));

export const batchReports: BatchReport[] = [];

export const consents: Consent[] = sessions.map((s, i) => ({
  id: `consent-${i + 1}`,
  institute_id: s.institute_id,
  student_id: s.student_id,
  purpose: "Interview processing and institute reporting",
  version: "v1.2",
  guardian_ref: null,
  at: "2026-08-20",
}));

export const auditLog: AuditLogEntry[] = [];
