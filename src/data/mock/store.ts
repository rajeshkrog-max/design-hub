// In-memory store backed by localStorage. This is the future backend contract:
// every service reads and mutates these tables, always scoped by institute_id.
import { aptitudeAttempts } from "./aptitude";
import { batches } from "./batches";
import { companies } from "./companies";
import { auditLog, batchReports, consents, gapDiagnoses, reports, resources } from "./insights";
import { institutes } from "./institutes";
import { offers, restartRequests } from "./offers";
import { profiles } from "./profiles";
import { rounds, sessions } from "./sessions";
import { students } from "./students";
import { instituteUsers } from "./users";
import type {
  AptitudeAttempt, AuditLogEntry, Batch, BatchReport, CompanyProfile, Consent,
  GapDiagnosis, Institute, InstituteUser, InterviewSession, Offer, Report, Resource,
  RestartRequest, SessionRound, Student, StudentProfile,
} from "@/types/arena";

export interface Store {
  institutes: Institute[];
  institute_users: InstituteUser[];
  batches: Batch[];
  students: Student[];
  student_profiles: StudentProfile[];
  company_profiles: CompanyProfile[];
  interview_sessions: InterviewSession[];
  session_rounds: SessionRound[];
  aptitude_attempts: AptitudeAttempt[];
  offers: Offer[];
  reports: Report[];
  gap_diagnoses: GapDiagnosis[];
  resources: Resource[];
  restart_requests: RestartRequest[];
  batch_reports: BatchReport[];
  consents: Consent[];
  audit_log: AuditLogEntry[];
}

const KEY = "sera-store-v3";

function seed(): Store {
  return {
    institutes: structuredClone(institutes),
    institute_users: structuredClone(instituteUsers),
    batches: structuredClone(batches),
    students: structuredClone(students),
    student_profiles: structuredClone(profiles),
    company_profiles: structuredClone(companies),
    interview_sessions: structuredClone(sessions),
    session_rounds: structuredClone(rounds),
    aptitude_attempts: structuredClone(aptitudeAttempts),
    offers: structuredClone(offers),
    reports: structuredClone(reports),
    gap_diagnoses: structuredClone(gapDiagnoses),
    resources: structuredClone(resources),
    restart_requests: structuredClone(restartRequests),
    batch_reports: structuredClone(batchReports),
    consents: structuredClone(consents),
    audit_log: structuredClone(auditLog),
  };
}

let store: Store | null = null;
const listeners = new Set<() => void>();

export function getStore(): Store {
  if (store) return store;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      store = JSON.parse(raw) as Store;
      return store;
    }
  } catch {
    // fall through to seed
  }
  store = seed();
  persist();
  return store;
}

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // storage full or unavailable — keep in-memory
  }
  listeners.forEach((fn) => fn());
}

export function resetStore() {
  store = seed();
  persist();
}

export function subscribeStore(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
