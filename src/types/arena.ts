// Data contract — matches the future database tables one to one (snake_case).
// Types only; no database. Mock data lives in src/data/mock/.

export type RoundKey = "screening" | "hr_bp" | "functional" | "ceo";
export type SessionStatus = "in_progress" | "completed" | "abandoned" | "restarted";
export type RoundStatus = "locked" | "ready" | "live" | "completed" | "incomplete";
export type RoundVerdict = "passed" | "needs_improvement";
export type GapType = "communication" | "skill" | "expectation" | "aptitude";
export type OfferDecision = "pending" | "accepted" | "declined";
export type RestartStatus = "pending" | "approved" | "declined" | "used";
export type StudentStatus = "invited" | "active" | "archived";
export type InstituteRole = "admin" | "viewer";
export type ProfileTierName = "Starter" | "Good" | "Strong";
export type SkillLevel = "basic" | "intermediate" | "advanced";

export interface Institute {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  status: "active" | "paused";
  pass_bar: number;
  ceo_threshold: number;
  created_at: string;
}

export interface InstituteUser {
  id: string;
  institute_id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: InstituteRole;
  status: "active" | "invited";
  created_at: string;
}

export interface Batch {
  id: string;
  institute_id: string;
  name: string;
  program: string;
  year: number;
  invite_code: string;
  created_at: string;
}

export interface Student {
  id: string;
  institute_id: string;
  batch_id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  photo_url: string | null;
  status: StudentStatus;
  consent_at: string | null;
  created_at: string;
}

export interface PersonalSection {
  name: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  photo_url: string | null;
}

export interface EducationSection {
  degree: string;
  branch: string;
  college: string;
  grad_year: number | null;
  cgpa: string;
  class_xii?: string;
  class_x?: string;
  gap?: string;
}

export interface SkillItem {
  name: string;
  level: SkillLevel;
}

export interface SkillsSection {
  technical: SkillItem[];
  tools: SkillItem[];
  soft: string[];
}

export interface PreferencesSection {
  role: string;
  cities: string[];
  expected_ctc: string;
  relocate: boolean;
  available_from: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  dates: string;
  type: string;
  achievements: string;
}

export interface ProjectItem {
  title: string;
  stack: string;
  role: string;
  impact: string;
  link: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  year: string;
  link: string;
}

export type ProfileSectionKey =
  | "personal"
  | "education"
  | "skills"
  | "preferences"
  | "summary"
  | "experience"
  | "projects"
  | "certifications"
  | "achievements"
  | "activities"
  | "languages";

export interface StudentProfile {
  student_id: string;
  institute_id: string;
  personal: PersonalSection | null;
  education: EducationSection | null;
  skills: SkillsSection | null;
  preferences: PreferencesSection | null;
  summary: string | null;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: string[];
  activities: string[];
  languages: string[];
  strength_score: number;
  strength_tier: ProfileTierName;
  required_complete: boolean;
  cv_file_key: string | null;
  cv_extracted: boolean;
  updated_at: string;
}

export interface CompanyProfile {
  id: string;
  source: "web" | "manual" | "yzi_dashboard";
  name: string;
  sector: string;
  sub_sector: string;
  city: string;
  size: string;
  role: string;
  ctc_min: number;
  ctc_max: number;
  tier: ProfileTierName;
  jd: string;
  requirements: string[];
  interview_style: string;
  sources: string[];
  is_sample: boolean;
  generated_at: string;
  expires_at: string;
}

export interface InterviewSession {
  id: string;
  institute_id: string;
  student_id: string;
  attempt_no: number;
  company_profile_id: string | null;
  company_options: string[];
  context: string;
  status: SessionStatus;
  average_score: number | null;
  ceo_unlocked: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface RubricBar {
  label: string;
  score: number;
}

export interface GapEvidence {
  text: string;
  timestamp: string;
}

export interface SessionRound {
  id: string;
  institute_id: string;
  session_id: string;
  round: RoundKey;
  try_no: 1 | 2;
  is_current: boolean;
  persona: string;
  retell_agent_id: string | null;
  retell_call_id: string | null;
  status: RoundStatus;
  progress_pct: number;
  score: number | null;
  verdict: RoundVerdict | null;
  rubric: RubricBar[];
  strengths: string[];
  gaps: GapEvidence[];
  expertise: string[];
  notes_for_next: string;
  transcript_key: string | null;
  resume_used: boolean;
  disconnect_count: number;
  duration_sec: number;
  started_at: string | null;
  ended_at: string | null;
}

export interface AptitudeQuestion {
  id: string;
  kind: "mcq" | "written";
  topic: string;
  prompt: string;
  options?: string[];
  correct?: number;
}

export interface AptitudeAttempt {
  id: string;
  institute_id: string;
  round_id: string;
  questions: AptitudeQuestion[];
  answers: Record<string, number | string>;
  mcq_score: number | null;
  written_feedback: string | null;
  submitted_at: string | null;
}

export interface Offer {
  id: string;
  institute_id: string;
  session_id: string;
  role: string;
  ctc: string;
  joining: string;
  decision: OfferDecision;
  decided_at: string | null;
}

export interface Report {
  id: string;
  institute_id: string;
  session_id: string;
  overall_score: number;
  verdict: string;
  report: Record<string, unknown>;
  pdf_key: string | null;
  created_at: string;
}

export interface GapDiagnosis {
  id: string;
  institute_id: string;
  session_id: string;
  gap_type: GapType;
  title: string;
  evidence: string;
  resource_ids: string[];
}

export interface Resource {
  id: string;
  gap_type: GapType;
  skill: string;
  level: string;
  title: string;
  url: string;
  kind: string;
  is_paid: boolean;
  is_affiliate: boolean;
}

export interface RestartRequest {
  id: string;
  institute_id: string;
  student_id: string;
  session_id: string;
  reason: string;
  status: RestartStatus;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface BatchReport {
  id: string;
  institute_id: string;
  batch_id: string;
  period_start: string;
  period_end: string;
  summary: Record<string, unknown>;
  pdf_key: string | null;
  generated_by: string;
  created_at: string;
}

export interface Consent {
  id: string;
  institute_id: string;
  student_id: string;
  purpose: string;
  version: string;
  guardian_ref: string | null;
  at: string;
}

export interface AuditLogEntry {
  id: string;
  institute_id: string;
  actor_id: string;
  actor_type: "student" | "institute";
  action: string;
  target_type: string;
  target_id: string;
  at: string;
}

export interface SessionUser {
  role: "student" | "institute";
  auth_user_id: string;
  student_id?: string;
  institute_user_id?: string;
  institute_id: string;
}

/** Derived, per-student dashboard state — computed by the service layer. */
export interface StudentDerived {
  student: Student;
  profile: StudentProfile | null;
  session: InterviewSession | null;
  rounds: SessionRound[];
  offer: Offer | null;
  restart: RestartRequest | null;
  state_label: string;
  current_round: RoundKey | null;
  last_score: number | null;
  verdict: string;
  weak_area: string;
  readiness: number;
}
